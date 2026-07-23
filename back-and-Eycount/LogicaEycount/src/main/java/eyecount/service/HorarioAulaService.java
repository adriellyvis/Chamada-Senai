package eyecount.service;

import eyecount.dto.aula.AtualizarHorarioAulaDTO;
import eyecount.dto.aula.CriarHorarioAulaDTO;
import eyecount.dto.aula.HorarioAulaDTO;
import eyecount.model.HorarioAula;
import eyecount.model.TurmaDisciplina;
import eyecount.repository.HorarioAulaRepository;
import eyecount.repository.TurmaDisciplinaRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/*
 * Servico responsavel pelas regras de negocio dos horarios de aula.
 *
 * Esta classe permite:
 * - cadastrar horarios;
 * - listar todos os horarios;
 * - listar horarios por vinculo;
 * - atualizar horarios;
 * - ativar ou desativar horarios;
 * - validar horario, vigencia e conflitos;
 * - converter a entidade para DTO.
 */
@Service
@AllArgsConstructor
public class HorarioAulaService {

    // Repository usado para consultar e salvar horarios de aula.
    private final HorarioAulaRepository horarioAulaRepository;

    // Repository usado para buscar o vinculo entre turma, disciplina e professor.
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;

    /*
     * Cadastra um novo horario de aula.
     *
     * Antes de salvar, o metodo valida:
     * - o vinculo entre turma, disciplina e professor;
     * - o horario inicial e final;
     * - o periodo de vigencia;
     * - conflitos de turma e professor.
     */
    public HorarioAulaDTO cadastrar(
            CriarHorarioAulaDTO dto
    ) {

        /*
         * Busca o vinculo informado no DTO.
         *
         * Esse vinculo identifica:
         * - a turma;
         * - a disciplina;
         * - o professor.
         */
        TurmaDisciplina vinculo =
                buscarVinculo(
                        dto.getTurmaDisciplinaId()
                );

        // Valida se o horario final ocorre depois do inicial.
        validarHorario(
                dto.getHoraInicio(),
                dto.getHoraFim()
        );

        // Valida o periodo em que o horario ficara ativo.
        validarVigencia(
                dto.getDataInicioVigencia(),
                dto.getDataFimVigencia()
        );

        /*
         * Verifica se o novo horario entra em conflito
         * com outro horario da mesma turma ou professor.
         *
         * O ultimo parametro e null porque este e um novo cadastro
         * e nao existe um ID que deva ser ignorado.
         */
        validarConflitos(
                vinculo,
                dto.getDiaSemana(),
                dto.getHoraInicio(),
                dto.getHoraFim(),
                dto.getDataInicioVigencia(),
                dto.getDataFimVigencia(),
                null
        );

        // Cria uma nova entidade ainda nao salva.
        HorarioAula horario = new HorarioAula();

        // Define o vinculo entre turma, disciplina e professor.
        horario.setTurmaDisciplina(vinculo);

        // Define o dia da semana em que a aula ocorre.
        horario.setDiaSemana(dto.getDiaSemana());

        // Define o horario programado de inicio.
        horario.setHoraInicio(dto.getHoraInicio());

        // Define o horario programado de termino.
        horario.setHoraFim(dto.getHoraFim());

        /*
         * Define a tolerancia em minutos.
         *
         * Quando o valor nao foi informado,
         * usa 30 minutos como padrao.
         */
        horario.setToleranciaMinutos(
                dto.getToleranciaMinutos() != null
                        ? dto.getToleranciaMinutos()
                        : 30
        );

        /*
         * Define se a chamada sera aberta automaticamente.
         *
         * Quando o valor nao foi informado,
         * usa true como padrao.
         */
        horario.setAberturaAutomatica(
                dto.getAberturaAutomatica() != null
                        ? dto.getAberturaAutomatica()
                        : true
        );

        /*
         * Define se a chamada sera encerrada automaticamente.
         *
         * Quando o valor nao foi informado,
         * usa true como padrao.
         */
        horario.setEncerramentoAutomatico(
                dto.getEncerramentoAutomatico() != null
                        ? dto.getEncerramentoAutomatico()
                        : true
        );

        // Define a data inicial de vigencia.
        horario.setDataInicioVigencia(
                dto.getDataInicioVigencia()
        );

        // Define a data final de vigencia.
        horario.setDataFimVigencia(
                dto.getDataFimVigencia()
        );

        // Todo horario novo comeca ativo.
        horario.setAtivo(true);

        // Salva o horario no banco.
        HorarioAula salvo =
                horarioAulaRepository.save(horario);

        // Converte a entidade salva para DTO.
        return converter(salvo);
    }

    /*
     * Lista todos os horarios cadastrados.
     *
     * O resultado e ordenado por:
     * - dia da semana;
     * - horario de inicio.
     */
    public List<HorarioAulaDTO> listarTodos() {

        return horarioAulaRepository

                // Busca todos os horarios ja ordenados.
                .findAllByOrderByDiaSemanaAscHoraInicioAsc()

                // Transforma a lista em um fluxo.
                .stream()

                // Converte cada entidade em HorarioAulaDTO.
                .map(this::converter)

                // Monta a lista final.
                .toList();
    }

    /*
     * Lista os horarios de um vinculo especifico.
     *
     * O filtro usa o ID do vinculo entre
     * turma, disciplina e professor.
     */
    public List<HorarioAulaDTO> listarPorVinculo(
            Integer turmaDisciplinaId
    ) {

        return horarioAulaRepository

                /*
                 * Busca somente horarios relacionados
                 * ao turmaDisciplinaId informado.
                 *
                 * O resultado e ordenado por dia e hora de inicio.
                 */
                .findByTurmaDisciplina_IdOrderByDiaSemanaAscHoraInicioAsc(
                        turmaDisciplinaId
                )

                // Transforma a lista em um fluxo.
                .stream()

                // Converte cada HorarioAula em DTO.
                .map(this::converter)

                // Monta a lista final.
                .toList();
    }

    /*
     * Atualiza parcialmente um horario de aula.
     *
     * Quando um campo nao e enviado no DTO,
     * o valor atual do horario e preservado.
     */
    public HorarioAulaDTO atualizar(
            Integer id,
            AtualizarHorarioAulaDTO dto
    ) {

        /*
         * Busca o horario pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
        HorarioAula horario =
                horarioAulaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Horário de aula não encontrado"
                                )
                        );

        /*
         * Usa o novo vinculo quando foi informado.
         * Caso contrario, mantem o vinculo atual.
         */
        TurmaDisciplina vinculo =
                dto.getTurmaDisciplinaId() != null
                        ? buscarVinculo(
                        dto.getTurmaDisciplinaId()
                )
                        : horario.getTurmaDisciplina();

        /*
         * Usa o novo dia da semana quando foi informado.
         * Caso contrario, mantem o dia atual.
         */
        DayOfWeek diaSemanaFinal =
                dto.getDiaSemana() != null
                        ? dto.getDiaSemana()
                        : horario.getDiaSemana();

        // Preserva a hora inicial quando nao foi enviada.
        LocalTime horaInicioFinal =
                dto.getHoraInicio() != null
                        ? dto.getHoraInicio()
                        : horario.getHoraInicio();

        // Preserva a hora final quando nao foi enviada.
        LocalTime horaFimFinal =
                dto.getHoraFim() != null
                        ? dto.getHoraFim()
                        : horario.getHoraFim();

        // Preserva a data inicial de vigencia quando nao foi enviada.
        LocalDate dataInicioFinal =
                dto.getDataInicioVigencia() != null
                        ? dto.getDataInicioVigencia()
                        : horario.getDataInicioVigencia();

        // Preserva a data final de vigencia quando nao foi enviada.
        LocalDate dataFimFinal =
                dto.getDataFimVigencia() != null
                        ? dto.getDataFimVigencia()
                        : horario.getDataFimVigencia();

        /*
         * Define o status final.
         *
         * Quando o DTO traz o campo ativo, usa o novo valor.
         * Caso contrario, mantem o valor atual.
         */
        boolean ativoFinal =
                dto.getAtivo() != null
                        ? dto.getAtivo()
                        : Boolean.TRUE.equals(
                        horario.getAtivo()
                );

        // Valida o conjunto final de horarios.
        validarHorario(
                horaInicioFinal,
                horaFimFinal
        );

        // Valida o conjunto final de datas.
        validarVigencia(
                dataInicioFinal,
                dataFimFinal
        );

        /*
         * Os conflitos so sao validados quando
         * o horario final ficara ativo.
         *
         * Horarios desativados podem permanecer no banco
         * mesmo que coincidam com outros.
         */
        if (ativoFinal) {
            validarConflitos(
                    vinculo,
                    diaSemanaFinal,
                    horaInicioFinal,
                    horaFimFinal,
                    dataInicioFinal,
                    dataFimFinal,

                    /*
                     * Ignora o proprio horario durante a edicao
                     * para ele nao entrar em conflito com ele mesmo.
                     */
                    id
            );
        }

        // Atualiza o vinculo final.
        horario.setTurmaDisciplina(vinculo);

        // Atualiza o dia da semana final.
        horario.setDiaSemana(diaSemanaFinal);

        // Atualiza os horarios finais.
        horario.setHoraInicio(horaInicioFinal);
        horario.setHoraFim(horaFimFinal);

        // Atualiza o periodo de vigencia final.
        horario.setDataInicioVigencia(dataInicioFinal);
        horario.setDataFimVigencia(dataFimFinal);

        // Atualiza a tolerancia somente quando foi informada.
        if (dto.getToleranciaMinutos() != null) {
            horario.setToleranciaMinutos(
                    dto.getToleranciaMinutos()
            );
        }

        // Atualiza a abertura automatica somente quando foi informada.
        if (dto.getAberturaAutomatica() != null) {
            horario.setAberturaAutomatica(
                    dto.getAberturaAutomatica()
            );
        }

        // Atualiza o encerramento automatico somente quando foi informado.
        if (dto.getEncerramentoAutomatico() != null) {
            horario.setEncerramentoAutomatico(
                    dto.getEncerramentoAutomatico()
            );
        }

        // Atualiza o status final do horario.
        horario.setAtivo(ativoFinal);

        // Salva as alteracoes no banco.
        HorarioAula salvo =
                horarioAulaRepository.save(horario);

        // Converte o resultado para DTO.
        return converter(salvo);
    }

    /*
     * Ativa ou desativa um horario.
     *
     * Quando o horario sera reativado,
     * os conflitos sao validados novamente.
     */
    public HorarioAulaDTO alterarStatus(
            Integer id
    ) {

        // Busca o horario pelo ID.
        HorarioAula horario =
                horarioAulaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Horário de aula não encontrado"
                                )
                        );

        /*
         * Inverte o status atual:
         * - true vira false;
         * - false ou null vira true.
         */
        boolean novoStatus =
                !Boolean.TRUE.equals(
                        horario.getAtivo()
                );

        /*
         * Quando o novo status sera ativo,
         * verifica se o horario entra em conflito.
         */
        if (novoStatus) {
            validarConflitos(
                    horario.getTurmaDisciplina(),
                    horario.getDiaSemana(),
                    horario.getHoraInicio(),
                    horario.getHoraFim(),
                    horario.getDataInicioVigencia(),
                    horario.getDataFimVigencia(),

                    // Ignora o proprio registro na consulta.
                    horario.getId()
            );
        }

        // Atualiza o status.
        horario.setAtivo(novoStatus);

        // Salva a alteracao no banco.
        HorarioAula salvo =
                horarioAulaRepository.save(horario);

        // Converte o resultado para DTO.
        return converter(salvo);
    }

    /*
     * Busca o vinculo entre turma, disciplina e professor.
     *
     * O metodo tambem valida ID nulo e vinculo inexistente.
     */
    private TurmaDisciplina buscarVinculo(
            Integer id
    ) {

        // Impede a busca quando o ID nao foi informado.
        if (id == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o vínculo entre turma, disciplina e professor"
            );
        }

        /*
         * Busca o vinculo pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
        return turmaDisciplinaRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Vínculo entre turma, disciplina e professor não encontrado"
                        )
                );
    }

    /*
     * Valida o horario inicial e final.
     *
     * Os dois valores sao obrigatorios
     * e o fim precisa ser posterior ao inicio.
     */
    private void validarHorario(
            LocalTime horaInicio,
            LocalTime horaFim
    ) {

        // Impede horario incompleto.
        if (
                horaInicio == null ||
                        horaFim == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o horário de início e de término"
            );
        }

        // Impede fim igual ou anterior ao inicio.
        if (!horaFim.isAfter(horaInicio)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O horário de término deve ser posterior ao início"
            );
        }
    }

    /*
     * Valida o periodo de vigencia.
     *
     * As duas datas podem ser nulas.
     * Quando uma data e informada, a outra tambem deve existir.
     */
    private void validarVigencia(
            LocalDate dataInicio,
            LocalDate dataFim
    ) {

        // Sem as duas datas, o horario nao possui limite de vigencia.
        if (
                dataInicio == null &&
                        dataFim == null
        ) {
            return;
        }

        // Impede o envio de apenas uma das datas.
        if (
                dataInicio == null ||
                        dataFim == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o início e o fim da vigência"
            );
        }

        // A data final precisa ser posterior a inicial.
        if (!dataFim.isAfter(dataInicio)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O fim da vigência deve ser posterior ao início"
            );
        }
    }

    /*
     * Verifica conflitos de horario.
     *
     * O metodo impede sobreposicao:
     * - para a mesma turma;
     * - para o mesmo professor.
     *
     * O conflito considera:
     * - dia da semana;
     * - horario inicial e final;
     * - periodo de vigencia;
     * - registro que deve ser ignorado durante edicao.
     */
    private void validarConflitos(
            TurmaDisciplina vinculo,
            DayOfWeek diaSemana,
            LocalTime horaInicio,
            LocalTime horaFim,
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer ignorarId
    ) {

        // O dia da semana e obrigatorio.
        if (diaSemana == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o dia da semana"
            );
        }

        /*
         * Conta conflitos da turma.
         *
         * A consulta filtra por:
         * - ID da turma;
         * - dia da semana;
         * - sobreposicao de horario;
         * - sobreposicao de vigencia;
         * - ID ignorado na edicao.
         */
        long conflitosTurma =
                horarioAulaRepository
                        .contarConflitosTurma(
                                vinculo.getTurma().getId(),
                                diaSemana,
                                horaInicio,
                                horaFim,
                                dataInicio,
                                dataFim,
                                ignorarId
                        );

        // Bloqueia quando a turma ja possui horario conflitante.
        if (conflitosTurma > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A turma já possui uma aula nesse dia e horário"
            );
        }

        /*
         * Conta conflitos do professor.
         *
         * A consulta usa os mesmos criterios,
         * mas filtra pelo ID do professor.
         */
        long conflitosProfessor =
                horarioAulaRepository
                        .contarConflitosProfessor(
                                vinculo.getProfessor().getId(),
                                diaSemana,
                                horaInicio,
                                horaFim,
                                dataInicio,
                                dataFim,
                                ignorarId
                        );

        // Bloqueia quando o professor ja possui horario conflitante.
        if (conflitosProfessor > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O professor já possui uma aula nesse dia e horário"
            );
        }
    }

    /*
     * Converte HorarioAula em HorarioAulaDTO.
     *
     * O DTO inclui dados do horario e tambem
     * os dados relacionados de turma, disciplina e professor.
     */
    private HorarioAulaDTO converter(
            HorarioAula horario
    ) {

        // Recupera o vinculo relacionado ao horario.
        TurmaDisciplina vinculo =
                horario.getTurmaDisciplina();

        return new HorarioAulaDTO(
                // ID do horario.
                horario.getId(),

                // ID do vinculo entre turma, disciplina e professor.
                vinculo.getId(),

                // Dados da turma.
                vinculo.getTurma().getId(),
                vinculo.getTurma().getNome(),

                // Dados da disciplina.
                vinculo.getDisciplina().getId(),
                vinculo.getDisciplina().getNome(),

                // Dados do professor.
                vinculo.getProfessor().getId(),
                vinculo.getProfessor()
                        .getUsuario()
                        .getNome(),

                // Dia da semana.
                horario.getDiaSemana(),

                // Horarios de inicio e fim.
                horario.getHoraInicio(),
                horario.getHoraFim(),

                // Tolerancia em minutos.
                horario.getToleranciaMinutos(),

                // Configuracoes automaticas.
                horario.getAberturaAutomatica(),
                horario.getEncerramentoAutomatico(),

                // Periodo de vigencia.
                horario.getDataInicioVigencia(),
                horario.getDataFimVigencia(),

                // Status do horario.
                horario.getAtivo()
        );
    }
}