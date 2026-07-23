package eyecount.service;

import eyecount.model.HorarioAula;
import eyecount.repository.HorarioAulaRepository;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

/*
 * Serviço responsável por verificar os horários cadastrados
 * e abrir ou encerrar chamadas automaticamente.
 *
 * O Spring executa este serviço a cada minuto.
 */
@Service
@AllArgsConstructor
public class AulaAgendadorService {

    /*
     * Logger usado para registrar erros ocorridos durante
     * o processamento automático dos horários.
     */
    private static final Logger LOGGER =
            LoggerFactory.getLogger(AulaAgendadorService.class);

    /*
     * Define o fuso horário usado pelo agendador.
     * Isso evita diferenças entre o horário do servidor e o horário local.
     */
    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    // Repository responsável por buscar os horários de aula no banco.
    private final HorarioAulaRepository horarioAulaRepository;

    // Serviço que contém as regras para abrir e encerrar uma aula.
    private final AulaService aulaService;

    /*
     * Executa automaticamente a cada minuto.
     *
     * Expressão cron:
     * segundo 0, em todos os minutos, horas, dias, meses e dias da semana.
     *
     * O metodo:
     * 1. descobre a data e a hora atuais;
     * 2. busca os horários ativos do dia;
     * 3. verifica se cada horário está vigente;
     * 4. tenta abrir ou encerrar a chamada correspondente.
     */
    @Scheduled(
            cron = "0 * * * * *",
            zone = "America/Sao_Paulo"
    )
    public void processarHorariosAutomaticos() {

        // Obtém a data atual usando o fuso horário de São Paulo.
        LocalDate hoje =
                LocalDate.now(FUSO_HORARIO);

        /*
         * Obtém a hora atual e remove segundos e nanossegundos.
         * O agendador trabalha somente com hora e minuto.
         */
        LocalTime agora =
                LocalTime.now(FUSO_HORARIO)
                        .withSecond(0)
                        .withNano(0);

        /*
         * Busca somente horários:
         * - ativos;
         * - correspondentes ao dia da semana atual;
         * - ordenados pelo horário de início.
         */
        List<HorarioAula> horarios =
                horarioAulaRepository
                        .findByAtivoTrueAndDiaSemanaOrderByHoraInicioAsc(
                                hoje.getDayOfWeek()
                        );

        // Percorre todos os horários ativos encontrados para o dia atual.
        for (HorarioAula horario : horarios) {

            /*
             * Ignora o horário quando a data atual está fora
             * do período de vigência configurado.
             */
            if (!estaVigente(horario, hoje)) {
                continue;
            }

            try {
                /*
                 * Verifica se a chamada precisa ser aberta.
                 * A abertura só ocorre quando a opção automática está ativa
                 * e a hora atual está dentro do período da aula.
                 */
                processarAbertura(
                        horario,
                        hoje,
                        agora
                );

                /*
                 * Verifica se a chamada precisa ser encerrada.
                 * O encerramento ocorre quando a hora final já foi alcançada.
                 */
                processarEncerramento(
                        horario,
                        hoje,
                        agora
                );

            } catch (Exception erro) {
                /*
                 * Registra o erro sem interromper o processamento.
                 * Assim, uma falha em um horário não impede os outros
                 * horários de serem verificados.
                 */
                LOGGER.error(
                        "Erro ao processar horário automático {}: {}",
                        horario.getId(),
                        erro.getMessage(),
                        erro
                );
            }
        }
    }

    /*
     * Verifica se uma chamada deve ser aberta automaticamente.
     *
     * A chamada é aberta quando:
     * - a abertura automática está habilitada;
     * - a hora de início já chegou;
     * - a hora de término ainda não chegou.
     */
    private void processarAbertura(
            HorarioAula horario,
            LocalDate hoje,
            LocalTime agora
    ) {

        /*
         * Interrompe o metodo quando a abertura automática
         * está desativada ou possui valor nulo.
         */
        if (!Boolean.TRUE.equals(
                horario.getAberturaAutomatica()
        )) {
            return;
        }

        /*
         * Retorna true quando a hora atual é igual ou posterior
         * ao horário de início da aula.
         */
        boolean horarioJaComecou =
                !agora.isBefore(horario.getHoraInicio());

        /*
         * Retorna true enquanto a hora atual ainda for anterior
         * ao horário final da aula.
         */
        boolean horarioAindaNaoTerminou =
                agora.isBefore(horario.getHoraFim());

        /*
         * Abre a chamada somente dentro do intervalo da aula.
         *
         * O AulaService impede que outra aula seja criada
         * novamente para o mesmo horário e a mesma data.
         */
        if (
                horarioJaComecou &&
                        horarioAindaNaoTerminou
        ) {
            aulaService.abrirChamadaAutomatica(
                    horario,
                    hoje
            );
        }
    }

    /*
     * Verifica se uma chamada deve ser encerrada automaticamente.
     *
     * O encerramento ocorre quando:
     * - o encerramento automático está habilitado;
     * - a hora atual é igual ou posterior à hora final.
     */
    private void processarEncerramento(
            HorarioAula horario,
            LocalDate hoje,
            LocalTime agora
    ) {

        /*
         * Interrompe o metodo quando o encerramento automático
         * está desativado ou possui valor nulo.
         */
        if (!Boolean.TRUE.equals(
                horario.getEncerramentoAutomatico()
        )) {
            return;
        }

        /*
         * Retorna true quando a hora atual é igual ou posterior
         * ao horário de término configurado.
         */
        boolean horarioTerminou =
                !agora.isBefore(horario.getHoraFim());

        /*
         * Solicita ao AulaService o encerramento da chamada.
         * O serviço também registra ausências para alunos sem presença.
         */
        if (horarioTerminou) {
            aulaService.encerrarChamadaAutomatica(
                    horario,
                    hoje
            );
        }
    }

    /*
     * Verifica se o horário está válido para a data atual.
     *
     * A data é considerada vigente quando:
     * - não existe data inicial ou hoje já alcançou essa data;
     * - não existe data final ou hoje ainda não ultrapassou essa data.
     */
    private boolean estaVigente(
            HorarioAula horario,
            LocalDate hoje
    ) {

        /*
         * Considera válido quando:
         * - a data inicial não foi informada;
         * - ou hoje é igual, ou posterior à data inicial.
         */
        boolean depoisDoInicio =
                horario.getDataInicioVigencia() == null ||
                        !hoje.isBefore(
                                horario.getDataInicioVigencia()
                        );

        /*
         * Considera válido quando:
         * - a data final não foi informada;
         * - ou hoje é igual ou anterior à data final.
         */
        boolean antesDoFim =
                horario.getDataFimVigencia() == null ||
                        !hoje.isAfter(
                                horario.getDataFimVigencia()
                        );

        // O horário só está vigente quando as duas condições são verdadeiras.
        return depoisDoInicio && antesDoFim;
    }
}