package prezence.service;

import prezence.dto.aviso.AvisoDTO;
import prezence.model.*;
import prezence.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AvisoService {

    private final AvisoRepository avisoRepository;
    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProfessorRepository professorRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final PresencaRepository presencaRepository;


    // =====================================================
    // GESTOR - ENVIAR AVISO
    // =====================================================

    @Transactional
    public AvisoDTO enviarPorGestor(
            Integer gestorUsuarioId,
            AvisoDTO dto
    ) {

        Usuario gestor =
                buscarUsuario(gestorUsuarioId);

        validarPerfil(
                gestor,
                "gestor"
        );

        if (dto.getAlunoUsuarioId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não informado"
            );
        }

        /*
         * A tela do gestor trabalha com Usuario.id. Por isso precisamos transformar:
         *
         * Usuario.id -> Aluno
         */
        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(
                                dto.getAlunoUsuarioId()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        validarConteudoBasico(dto);
        if (
                dto.getMensagem() == null
                        ||
                        dto.getMensagem().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mensagem é obrigatória"
            );
        }

        Aviso aviso = new Aviso();

        aviso.setAluno(aluno);
        aviso.setAutor(gestor);

        /*
         * Aviso do gestor não precisa necessariamente
         * estar ligado à turma.
         *
         * Porém, se o aluno possuir turma, podemos
         * guardar essa referência.
         */
        if (aluno.getTurma() != null) {
            aviso.setTurma(
                    aluno.getTurma()
            );
        }

        aviso.setTitulo(
                dto.getTitulo().trim()
        );

        aviso.setMensagem(
                dto.getMensagem().trim()
        );

        aviso.setCategoria(
                converterCategoria(
                        dto.getCategoria()
                )
        );

        aviso.setPrioridade(
                converterPrioridade(
                        dto.getPrioridade()
                )
        );

        aviso.setLido(false);

        Aviso salvo =
                avisoRepository.save(aviso);

        return converterParaDTO(salvo);
    }


    // =====================================================
    // PROFESSOR - ENVIAR FEEDBACK
    // =====================================================

    @Transactional
    public AvisoDTO enviarPorProfessor(
            Integer professorUsuarioId,
            AvisoDTO dto
    ) {

        Usuario usuarioProfessor =
                buscarUsuario(
                        professorUsuarioId
                );

        validarPerfil(
                usuarioProfessor,
                "professor"
        );

        Professor professor =
                professorRepository
                        .findByUsuarioId(
                                professorUsuarioId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Professor não encontrado"
                                )
                        );

        if (dto.getAlunoId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não informado"
            );
        }

        Aluno aluno =
                alunoRepository
                        .findById(
                                dto.getAlunoId()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        // =====================================================
        // TURMA DO ALUNO
        // =====================================================

        if (aluno.getTurma() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não possui turma cadastrada"
            );
        }

        Integer turmaId =
                aluno
                        .getTurma()
                        .getId();

        /*
         * Se o front enviar uma turma, ela precisa ser a turma real do aluno.
         */
        if (
                dto.getTurmaId() != null
                        &&
                        !dto.getTurmaId().equals(turmaId)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A turma informada não pertence ao aluno"
            );
        }

        // =====================================================
        // VALIDAR PROFESSOR NA TURMA
        // =====================================================

        boolean professorPertenceATurma =
                turmaDisciplinaRepository
                        .findByProfessorId(
                                professor.getId()
                        )
                        .stream()
                        .anyMatch(vinculo ->
                                vinculo.getTurma() != null
                                        &&
                                        vinculo
                                                .getTurma()
                                                .getId()
                                                .equals(turmaId)
                        );

        if (!professorPertenceATurma) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Este aluno não pertence a uma turma do professor"
            );
        }

        validarConteudoBasico(dto);

        // =====================================================
        // NOTA
        // =====================================================

        /*
         * A nota ainda é manual porque ainda não existe um módulo oficial de notas no PreZence.
         */
        if (
                dto.getNota() != null
                        &&
                        dto.getNota() < 0
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nota não pode ser negativa"
            );
        }

        // =====================================================
        // FREQUÊNCIA
        // =====================================================

        /*
         * Sempre calculamos novamente no back.
         * Não confiamos no valor vindo do navegador.
         */
        Double frequencia =
                presencaRepository
                        .calcularFrequenciaAlunoNaTurma(
                                aluno.getId(),
                                turmaId
                        );

        if (frequencia == null) {
            frequencia = 0.0;
        }

        frequencia =
                Math.round(
                        frequencia * 10.0
                ) / 10.0;

        // =====================================================
        // CRIAR AVISO
        // =====================================================

        Aviso aviso = new Aviso();

        aviso.setAluno(aluno);

        aviso.setAutor(
                usuarioProfessor
        );

        aviso.setTurma(
                aluno.getTurma()
        );

        aviso.setTitulo(
                dto.getTitulo().trim()
        );

        /*
         * Comentário do professor também pode ficar vazio.
         */
        aviso.setMensagem(
                dto.getMensagem() != null
                        ? dto.getMensagem().trim()
                        : ""
        );

        aviso.setCategoria(
                CategoriaAviso.FEEDBACK
        );

        // =====================================================
        // PRIORIDADE
        // =====================================================

        /*
         * Frequência inferior a 75% transforma automaticamente o feedback em IMPORTANTE.
         */
        if (frequencia < 75) {

            aviso.setPrioridade(
                    PrioridadeAviso.IMPORTANTE
            );

        } else {

            aviso.setPrioridade(
                    converterPrioridade(
                            dto.getPrioridade()
                    )
            );
        }

        // =====================================================
        // DADOS DO FEEDBACK
        // =====================================================

        aviso.setFrequencia(
                frequencia
        );

        aviso.setNota(
                dto.getNota()
        );

        /*
         * MELHORIAS AGORA É OPCIONAL.
         *
         * Se o professor não ativar a opção no front, será salvo como null.
         */
        aviso.setMelhorias(
                dto.getMelhorias() != null
                        && !dto.getMelhorias().isBlank()
                        ? dto.getMelhorias().trim()
                        : null
        );

        aviso.setLido(false);

        Aviso salvo =
                avisoRepository.save(aviso);

        return converterParaDTO(salvo);
    }


    // =====================================================
    // ALUNO - LISTAR AVISOS
    // =====================================================

    @Transactional(readOnly = true)
    public List<AvisoDTO> listarPorAlunoUsuario(
            Integer usuarioId
    ) {

        Usuario usuario =
                buscarUsuario(usuarioId);

        validarPerfil(
                usuario,
                "aluno"
        );

        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        return avisoRepository
                .findByAluno_IdOrderByDataCriacaoDesc(
                        aluno.getId()
                )
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }


    // =====================================================
    // ALUNO - MARCAR UM AVISO COMO LIDO
    // =====================================================

    @Transactional
    public void marcarComoLido(
            Integer usuarioId,
            Integer avisoId
    ) {

        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        Aviso aviso =
                avisoRepository
                        .findById(avisoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aviso não encontrado"
                                )
                        );

        if (
                aviso.getAluno() == null
                        ||
                        !aviso
                                .getAluno()
                                .getId()
                                .equals(aluno.getId())
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Este aviso não pertence ao aluno"
            );
        }

        aviso.setLido(true);

        avisoRepository.save(aviso);
    }


    // =====================================================
    // ALUNO - MARCAR TODOS COMO LIDOS
    // =====================================================

    @Transactional
    public void marcarTodosComoLidos(
            Integer usuarioId
    ) {

        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        List<Aviso> avisos =
                avisoRepository
                        .findByAluno_IdAndLidoFalse(
                                aluno.getId()
                        );

        avisos.forEach(aviso ->
                aviso.setLido(true)
        );

        avisoRepository.saveAll(avisos);
    }


    // =====================================================
    // MÉTODOS AUXILIARES
    // =====================================================

    private Usuario buscarUsuario(
            Integer usuarioId
    ) {

        if (usuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não informado"
            );
        }

        return usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado"
                        )
                );
    }


    private void validarPerfil(
            Usuario usuario,
            String perfilEsperado
    ) {

        if (
                usuario.getPerfil() == null
                        ||
                        usuario
                                .getPerfil()
                                .getNome() == null
                        ||
                        !usuario
                                .getPerfil()
                                .getNome()
                                .equalsIgnoreCase(
                                        perfilEsperado
                                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso negado"
            );
        }
    }


    private void validarConteudoBasico(
            AvisoDTO dto
    ) {

        if (
                dto.getTitulo() == null
                        ||
                        dto.getTitulo().isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Título é obrigatório"
            );
        }

        if (
                dto.getTitulo()
                        .trim()
                        .length() > 150
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O título deve possuir no máximo 150 caracteres"
            );
        }

        /*
         * Para feedback do professor, mensagem pode
         * ficar vazia porque 'melhorias' é o campo
         * principal complementar.
         *
         * Para aviso comum do gestor, ela será
         * validada no método correspondente.
         */
    }


    private CategoriaAviso converterCategoria(
            String categoria
    ) {

        if (
                categoria == null
                        ||
                        categoria.isBlank()
        ) {

            return CategoriaAviso.GERAL;
        }

        try {

            return CategoriaAviso.valueOf(
                    categoria
                            .trim()
                            .toUpperCase()
            );

        } catch (IllegalArgumentException erro) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Categoria de aviso inválida"
            );
        }
    }


    private PrioridadeAviso converterPrioridade(
            String prioridade
    ) {

        if (
                prioridade == null
                        ||
                        prioridade.isBlank()
        ) {

            return PrioridadeAviso.NORMAL;
        }

        try {

            return PrioridadeAviso.valueOf(
                    prioridade
                            .trim()
                            .toUpperCase()
            );

        } catch (IllegalArgumentException erro) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Prioridade de aviso inválida"
            );
        }
    }


    private AvisoDTO converterParaDTO(
            Aviso aviso
    ) {

        AvisoDTO dto = new AvisoDTO();

        dto.setId(aviso.getId());

        // =====================================================
        // ALUNO
        // =====================================================

        if (aviso.getAluno() != null) {

            dto.setAlunoId(
                    aviso.getAluno().getId()
            );

            if (aviso.getAluno().getUsuario() != null) {

                dto.setAlunoUsuarioId(
                        aviso
                                .getAluno()
                                .getUsuario()
                                .getId()
                );

                dto.setAlunoNome(
                        aviso
                                .getAluno()
                                .getUsuario()
                                .getNome()
                );
            }
        }

        // =====================================================
        // AUTOR
        // =====================================================

        if (aviso.getAutor() != null) {

            dto.setAutorUsuarioId(
                    aviso.getAutor().getId()
            );

            dto.setAutorNome(
                    aviso.getAutor().getNome()
            );

            if (
                    aviso.getAutor().getPerfil() != null
                            &&
                            aviso.getAutor().getPerfil().getNome() != null
            ) {

                dto.setAutorPerfil(
                        aviso
                                .getAutor()
                                .getPerfil()
                                .getNome()
                                .toUpperCase()
                );
            }
        }

        // =====================================================
        // TURMA
        // =====================================================

        if (aviso.getTurma() != null) {

            dto.setTurmaId(
                    aviso.getTurma().getId()
            );

            dto.setTurmaNome(
                    aviso.getTurma().getNome()
            );
        }

        // =====================================================
        // CONTEÚDO
        // =====================================================

        dto.setTitulo(
                aviso.getTitulo()
        );

        dto.setMensagem(
                aviso.getMensagem()
        );

        dto.setCategoria(
                aviso.getCategoria() != null
                        ? aviso.getCategoria().name()
                        : "GERAL"
        );

        dto.setPrioridade(
                aviso.getPrioridade() != null
                        ? aviso.getPrioridade().name()
                        : "NORMAL"
        );

        dto.setLido(
                Boolean.TRUE.equals(aviso.getLido())
        );

        // =====================================================
        // FEEDBACK
        // =====================================================

        dto.setFrequencia(
                aviso.getFrequencia()
        );

        dto.setNota(
                aviso.getNota()
        );

        dto.setMelhorias(
                aviso.getMelhorias()
        );

        dto.setDataCriacao(
                aviso.getDataCriacao()
        );

        return dto;
    }
}