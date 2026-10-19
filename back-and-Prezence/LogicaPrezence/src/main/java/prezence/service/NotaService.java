package prezence.service;

import prezence.dto.nota.NotaDTO;
import prezence.model.Aluno;
import prezence.model.Nota;
import prezence.model.TurmaDisciplina;
import prezence.repository.AlunoRepository;
import prezence.repository.NotaRepository;
import prezence.repository.TurmaDisciplinaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
    private final AlunoRepository alunoRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;


    // =====================================================
    // PROFESSOR - CADASTRAR NOTA
    // =====================================================

    @Transactional
    public NotaDTO cadastrar(
            Integer professorUsuarioId,
            NotaDTO dto
    ) {

        validarProfessorInformado(
                professorUsuarioId
        );

        validarDTO(
                dto
        );

        Aluno aluno =
                buscarAluno(
                        dto.getAlunoId()
                );

        TurmaDisciplina vinculo =
                buscarVinculo(
                        dto.getTurmaDisciplinaId()
                );


        // =====================================================
        // VALIDAR PROFESSOR
        // =====================================================

        validarProfessorDoVinculo(
                professorUsuarioId,
                vinculo
        );


        // =====================================================
        // VALIDAR ALUNO NA TURMA
        // =====================================================

        validarAlunoPertenceTurma(
                aluno,
                vinculo
        );


        // =====================================================
        // CRIAR NOTA
        // =====================================================

        Nota nota =
                new Nota();

        nota.setAluno(
                aluno
        );

        nota.setTurmaDisciplina(
                vinculo
        );

        preencherDadosNota(
                nota,
                dto
        );


        Nota salva =
                notaRepository.save(
                        nota
                );

        return converterParaDTO(
                salva
        );
    }


    // =====================================================
    // PROFESSOR - ATUALIZAR NOTA
    // =====================================================

    @Transactional
    public NotaDTO atualizar(
            Integer professorUsuarioId,
            Integer notaId,
            NotaDTO dto
    ) {

        validarProfessorInformado(
                professorUsuarioId
        );

        if (notaId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nota não informada"
            );
        }

        validarDTO(
                dto
        );


        Nota nota =
                notaRepository
                        .findById(notaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Nota não encontrada"
                                )
                        );


        // =====================================================
        // GARANTIR QUE O PROFESSOR É DONO DA DISCIPLINA
        // =====================================================

        validarProfessorDoVinculo(
                professorUsuarioId,
                nota.getTurmaDisciplina()
        );


        Aluno aluno =
                buscarAluno(
                        dto.getAlunoId()
                );

        TurmaDisciplina vinculo =
                buscarVinculo(
                        dto.getTurmaDisciplinaId()
                );


        /*
         * Também validamos o novo vínculo caso
         * o professor esteja alterando disciplina/aluno.
         */
        validarProfessorDoVinculo(
                professorUsuarioId,
                vinculo
        );

        validarAlunoPertenceTurma(
                aluno,
                vinculo
        );


        // =====================================================
        // ATUALIZAR
        // =====================================================

        nota.setAluno(
                aluno
        );

        nota.setTurmaDisciplina(
                vinculo
        );

        preencherDadosNota(
                nota,
                dto
        );


        Nota salva =
                notaRepository.save(
                        nota
                );

        return converterParaDTO(
                salva
        );
    }


    // =====================================================
    // PROFESSOR - EXCLUIR NOTA
    // =====================================================

    @Transactional
    public void excluir(
            Integer professorUsuarioId,
            Integer notaId
    ) {

        validarProfessorInformado(
                professorUsuarioId
        );

        Nota nota =
                notaRepository
                        .findById(notaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Nota não encontrada"
                                )
                        );


        validarProfessorDoVinculo(
                professorUsuarioId,
                nota.getTurmaDisciplina()
        );


        notaRepository.delete(
                nota
        );
    }


    // =====================================================
    // PROFESSOR - LISTAR NOTAS DA DISCIPLINA/TURMA
    // =====================================================

    @Transactional(readOnly = true)
    public List<NotaDTO> listarPorVinculo(
            Integer professorUsuarioId,
            Integer turmaDisciplinaId
    ) {

        validarProfessorInformado(
                professorUsuarioId
        );

        TurmaDisciplina vinculo =
                buscarVinculo(
                        turmaDisciplinaId
                );


        validarProfessorDoVinculo(
                professorUsuarioId,
                vinculo
        );


        return notaRepository
                .findByTurmaDisciplina_IdOrderByAluno_Usuario_NomeAscDataAvaliacaoDesc(
                        turmaDisciplinaId
                )
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }


    // =====================================================
    // PROFESSOR - NOTAS DE UM ALUNO NA DISCIPLINA
    // =====================================================

    @Transactional(readOnly = true)
    public List<NotaDTO> listarAlunoNoVinculo(
            Integer professorUsuarioId,
            Integer alunoId,
            Integer turmaDisciplinaId
    ) {

        validarProfessorInformado(
                professorUsuarioId
        );

        Aluno aluno =
                buscarAluno(
                        alunoId
                );

        TurmaDisciplina vinculo =
                buscarVinculo(
                        turmaDisciplinaId
                );


        validarProfessorDoVinculo(
                professorUsuarioId,
                vinculo
        );

        validarAlunoPertenceTurma(
                aluno,
                vinculo
        );


        return notaRepository
                .findByAluno_IdAndTurmaDisciplina_IdOrderByDataAvaliacaoDesc(
                        alunoId,
                        turmaDisciplinaId
                )
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }


    // =====================================================
    // ALUNO - LISTAR TODAS AS PRÓPRIAS NOTAS
    // =====================================================

    @Transactional(readOnly = true)
    public List<NotaDTO> listarPorAlunoUsuario(
            Integer alunoUsuarioId
    ) {

        if (alunoUsuarioId == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Aluno não informado"
            );
        }


        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(
                                alunoUsuarioId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );


        return notaRepository
                .findByAluno_IdOrderByDataAvaliacaoDesc(
                        aluno.getId()
                )
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }


    // =====================================================
    // PREENCHER NOTA
    // =====================================================

    private void preencherDadosNota(
            Nota nota,
            NotaDTO dto
    ) {

        nota.setTitulo(
                dto.getTitulo().trim()
        );

        nota.setNota(
                dto.getNota()
        );

        nota.setNotaMaxima(
                dto.getNotaMaxima()
        );

        nota.setBimestre(
                dto.getBimestre()
        );


        if (
                dto.getObservacao() != null
                        &&
                        !dto.getObservacao().isBlank()
        ) {

            nota.setObservacao(
                    dto.getObservacao().trim()
            );

        } else {

            nota.setObservacao(
                    null
            );
        }


        /*
         * Se não informar a data,
         * consideramos hoje.
         */
        nota.setDataAvaliacao(
                dto.getDataAvaliacao() != null
                        ? dto.getDataAvaliacao()
                        : LocalDate.now()
        );
    }


    // =====================================================
    // VALIDAR DTO
    // =====================================================

    private void validarDTO(
            NotaDTO dto
    ) {

        if (dto == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da nota não informados"
            );
        }


        if (dto.getAlunoId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno é obrigatório"
            );
        }


        if (dto.getTurmaDisciplinaId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Turma e disciplina são obrigatórias"
            );
        }


        if (
                dto.getTitulo() == null
                        ||
                        dto.getTitulo().isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Título da avaliação é obrigatório"
            );
        }


        if (dto.getTitulo().trim().length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Título da avaliação deve possuir no máximo 100 caracteres"
            );
        }


        if (dto.getNota() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nota é obrigatória"
            );
        }


        if (dto.getNotaMaxima() == null) {

            dto.setNotaMaxima(
                    10.0
            );
        }


        if (dto.getNotaMaxima() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nota máxima deve ser maior que zero"
            );
        }


        if (dto.getNota() < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nota não pode ser negativa"
            );
        }


        if (
                dto.getNota()
                        > dto.getNotaMaxima()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nota não pode ser maior que a nota máxima"
            );
        }


        if (
                dto.getBimestre() != null
                        &&
                        (
                                dto.getBimestre() < 1
                                        ||
                                        dto.getBimestre() > 4
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bimestre deve estar entre 1 e 4"
            );
        }


        if (
                dto.getObservacao() != null
                        &&
                        dto.getObservacao().length() > 500
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Observação deve possuir no máximo 500 caracteres"
            );
        }
    }


    // =====================================================
    // BUSCAR ALUNO
    // =====================================================

    private Aluno buscarAluno(
            Integer alunoId
    ) {

        if (alunoId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não informado"
            );
        }


        return alunoRepository
                .findById(alunoId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aluno não encontrado"
                        )
                );
    }


    // =====================================================
    // BUSCAR VÍNCULO
    // =====================================================

    private TurmaDisciplina buscarVinculo(
            Integer turmaDisciplinaId
    ) {

        if (turmaDisciplinaId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Turma e disciplina não informadas"
            );
        }


        return turmaDisciplinaRepository
                .findById(
                        turmaDisciplinaId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Vínculo entre turma e disciplina não encontrado"
                        )
                );
    }


    // =====================================================
    // VALIDAR PROFESSOR
    // =====================================================

    private void validarProfessorInformado(
            Integer professorUsuarioId
    ) {

        if (professorUsuarioId == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }
    }


    // =====================================================
    // VALIDAR PROFESSOR DO VÍNCULO
    // =====================================================

    private void validarProfessorDoVinculo(
            Integer professorUsuarioId,
            TurmaDisciplina vinculo
    ) {

        if (
                vinculo == null
                        ||
                        vinculo.getProfessor() == null
                        ||
                        vinculo.getProfessor().getUsuario() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Vínculo não possui professor configurado"
            );
        }


        Integer usuarioProfessorVinculo =
                vinculo
                        .getProfessor()
                        .getUsuario()
                        .getId();


        if (
                !professorUsuarioId.equals(
                        usuarioProfessorVinculo
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Professor não possui permissão para lançar notas nesta disciplina"
            );
        }
    }


    // =====================================================
    // VALIDAR ALUNO NA TURMA
    // =====================================================

    private void validarAlunoPertenceTurma(
            Aluno aluno,
            TurmaDisciplina vinculo
    ) {

        if (
                aluno.getTurma() == null
                        ||
                        vinculo.getTurma() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Turma do aluno ou da disciplina não encontrada"
            );
        }


        Integer turmaAlunoId =
                aluno
                        .getTurma()
                        .getId();

        Integer turmaVinculoId =
                vinculo
                        .getTurma()
                        .getId();


        if (!turmaAlunoId.equals(turmaVinculoId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não pertence à turma desta disciplina"
            );
        }
    }


    // =====================================================
    // CONVERTER PARA DTO
    // =====================================================

    private NotaDTO converterParaDTO(
            Nota nota
    ) {

        NotaDTO dto =
                new NotaDTO();


        dto.setId(
                nota.getId()
        );


        // =====================================================
        // ALUNO
        // =====================================================

        if (nota.getAluno() != null) {

            dto.setAlunoId(
                    nota
                            .getAluno()
                            .getId()
            );


            if (
                    nota.getAluno().getUsuario()
                            != null
            ) {

                dto.setAlunoUsuarioId(
                        nota
                                .getAluno()
                                .getUsuario()
                                .getId()
                );

                dto.setAlunoNome(
                        nota
                                .getAluno()
                                .getUsuario()
                                .getNome()
                );
            }
        }


        // =====================================================
        // TURMA / DISCIPLINA
        // =====================================================

        if (
                nota.getTurmaDisciplina()
                        != null
        ) {

            TurmaDisciplina vinculo =
                    nota.getTurmaDisciplina();


            dto.setTurmaDisciplinaId(
                    vinculo.getId()
            );


            if (vinculo.getTurma() != null) {

                dto.setTurmaId(
                        vinculo
                                .getTurma()
                                .getId()
                );

                dto.setTurmaNome(
                        vinculo
                                .getTurma()
                                .getNome()
                );
            }


            if (
                    vinculo.getDisciplina()
                            != null
            ) {

                dto.setDisciplinaId(
                        vinculo
                                .getDisciplina()
                                .getId()
                );

                dto.setDisciplinaNome(
                        vinculo
                                .getDisciplina()
                                .getNome()
                );
            }
        }


        // =====================================================
        // DADOS DA NOTA
        // =====================================================

        dto.setTitulo(
                nota.getTitulo()
        );

        dto.setNota(
                nota.getNota()
        );

        dto.setNotaMaxima(
                nota.getNotaMaxima()
        );

        dto.setBimestre(
                nota.getBimestre()
        );

        dto.setObservacao(
                nota.getObservacao()
        );

        dto.setDataAvaliacao(
                nota.getDataAvaliacao()
        );

        dto.setDataCriacao(
                nota.getDataCriacao()
        );


        return dto;
    }
}