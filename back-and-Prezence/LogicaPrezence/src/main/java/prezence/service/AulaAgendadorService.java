package prezence.service;

import prezence.model.HorarioAula;
import prezence.repository.HorarioAulaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/*
 * Serviço responsável por verificar os horários cadastrados
 * e abrir ou encerrar chamadas automaticamente.
 *
 * O Spring executa este serviço a cada minuto.
 *
 * Responsabilidades:
 * - buscar os horários ativos do dia;
 * - verificar o período de vigência;
 * - abrir chamadas automaticamente;
 * - encerrar chamadas automaticamente;
 * - permitir que o AulaService registre ausências.
 *
 * A tolerância para PRESENTE ou ATRASADO não é calculada aqui.
 * Essa regra pertence ao PresencaService.
 */
@Service
@RequiredArgsConstructor
public class AulaAgendadorService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(AulaAgendadorService.class);

    /*
     * Fuso horário oficial utilizado pelo sistema.
     */
    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    private final HorarioAulaRepository horarioAulaRepository;
    private final AulaService aulaService;

    /*
     * Executa automaticamente no segundo zero de cada minuto.
     */
    @Scheduled(
            cron = "0 * * * * *",
            zone = "America/Sao_Paulo"
    )
    public void processarHorariosAutomaticos() {

        /*
         * Obtém data e hora a partir do mesmo instante.
         *
         * Isso evita uma pequena inconsistência que poderia acontecer
         * caso a data mudasse entre duas chamadas separadas de now().
         */
        ZonedDateTime momentoAtual =
                ZonedDateTime.now(FUSO_HORARIO);

        LocalDate hoje =
                momentoAtual.toLocalDate();

        LocalTime agora =
                momentoAtual
                        .toLocalTime()
                        .withSecond(0)
                        .withNano(0);

        List<HorarioAula> horarios =
                horarioAulaRepository
                        .findByAtivoTrueAndDiaSemanaOrderByHoraInicioAsc(
                                hoje.getDayOfWeek()
                        );

        for (HorarioAula horario : horarios) {

            try {
                /*
                 * Impede que um horário com configuração incompleta
                 * cause erro e interrompa o processamento.
                 */
                if (!possuiHorarioValido(horario)) {
                    LOGGER.warn(
                            "Horário de aula {} ignorado por possuir hora inicial ou final inválida",
                            horario.getId()
                    );

                    continue;
                }

                /*
                 * Ignora horários fora do período de vigência.
                 */
                if (!estaVigente(horario, hoje)) {
                    continue;
                }

                /*
                 * Primeiro verifica se o horário já terminou.
                 *
                 * Quando já terminou, não existe motivo para tentar
                 * abrir a chamada antes de encerrá-la.
                 */
                if (!agora.isBefore(horario.getHoraFim())) {
                    processarEncerramento(
                            horario,
                            hoje,
                            agora
                    );

                    continue;
                }

                /*
                 * Se a aula ainda não terminou, verifica a abertura.
                 */
                processarAbertura(
                        horario,
                        hoje,
                        agora
                );

            } catch (Exception erro) {
                /*
                 * Uma falha em um horário não impede que os outros
                 * horários sejam processados.
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
     * Abre automaticamente uma chamada quando:
     *
     * - abertura automática está habilitada;
     * - o horário inicial já chegou;
     * - o horário final ainda não chegou.
     */
    private void processarAbertura(
            HorarioAula horario,
            LocalDate hoje,
            LocalTime agora
    ) {

        if (!Boolean.TRUE.equals(
                horario.getAberturaAutomatica()
        )) {
            return;
        }

        boolean horarioJaComecou =
                !agora.isBefore(
                        horario.getHoraInicio()
                );

        boolean horarioAindaNaoTerminou =
                agora.isBefore(
                        horario.getHoraFim()
                );

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
     * Encerra automaticamente uma chamada quando:
     *
     * - encerramento automático está habilitado;
     * - o horário final foi alcançado ou ultrapassado.
     *
     * O AulaService é responsável por:
     * - localizar a aula;
     * - registrar ausências;
     * - alterar o status para ENCERRADA;
     * - impedir duplicações.
     */
    private void processarEncerramento(
            HorarioAula horario,
            LocalDate hoje,
            LocalTime agora
    ) {

        if (!Boolean.TRUE.equals(
                horario.getEncerramentoAutomatico()
        )) {
            return;
        }

        boolean horarioTerminou =
                !agora.isBefore(
                        horario.getHoraFim()
                );

        if (horarioTerminou) {
            aulaService.encerrarChamadaAutomatica(
                    horario,
                    hoje
            );
        }
    }

    /*
     * Verifica se o horário possui:
     *
     * - hora inicial;
     * - hora final;
     * - hora final posterior à hora inicial.
     *
     * A validação já deve existir no cadastro, mas esta proteção
     * evita falhas caso existam dados antigos ou alterados diretamente
     * no banco de dados.
     */
    private boolean possuiHorarioValido(
            HorarioAula horario
    ) {

        if (
                horario.getHoraInicio() == null ||
                        horario.getHoraFim() == null
        ) {
            return false;
        }

        return horario
                .getHoraFim()
                .isAfter(
                        horario.getHoraInicio()
                );
    }

    /*
     * Verifica se o horário está vigente na data atual.
     *
     * A data é válida quando:
     *
     * - não existe início de vigência ou hoje já alcançou o início;
     * - não existe fim de vigência ou hoje ainda não ultrapassou o fim.
     */
    private boolean estaVigente(
            HorarioAula horario,
            LocalDate hoje
    ) {

        boolean depoisDoInicio =
                horario.getDataInicioVigencia() == null ||
                        !hoje.isBefore(
                                horario.getDataInicioVigencia()
                        );

        boolean antesDoFim =
                horario.getDataFimVigencia() == null ||
                        !hoje.isAfter(
                                horario.getDataFimVigencia()
                        );

        return depoisDoInicio && antesDoFim;
    }
}