package com.eyecount.service;

import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaMetricasDTO;
import com.eyecount.model.*;
import com.eyecount.repository.AlunoRepository;
import com.eyecount.repository.OcorrenciaRepository;
import com.eyecount.repository.ProfessorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;

    public OcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            AlunoRepository alunoRepository,
            ProfessorRepository professorRepository
    ) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
    }

    // =====================================================
    // CADASTRAR
    // =====================================================

    public OcorrenciaDTO cadastrarPorProfessor(
            Integer usuarioId,
            OcorrenciaDTO dto
    ) {
        Professor professor = professorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Professor não encontrado"
                        )
                );

        dto.setProfessorId(professor.getId());

        return cadastrar(dto);
    }

    public OcorrenciaDTO cadastrar(
            OcorrenciaDTO dto
    ) {

        Ocorrencia ocorrencia = new Ocorrencia();

        if (dto.getAlunoId() != null) {

            Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Aluno não encontrado"
                            )
                    );

            ocorrencia.setAluno(aluno);
        }

        if (dto.getProfessorId() != null) {

            Professor professor = professorRepository
                    .findById(dto.getProfessorId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Professor não encontrado"
                            )
                    );

            ocorrencia.setProfessor(professor);
        }

        ocorrencia.setTitulo(dto.getTitulo());

        ocorrencia.setDescricao(dto.getDescricao());

        ocorrencia.setGravidade(
                GravidadeOcorrencia.valueOf(
                        dto.getGravidade()
                )
        );

        ocorrencia.setTipo(
                TipoOcorrencia.valueOf(
                        dto.getTipo()
                )
        );

        ocorrencia.setStatus(
                StatusOcorrencia.PENDENTE
        );

        Ocorrencia salva =
                ocorrenciaRepository.save(ocorrencia);

        return converter(salva);
    }

    // =====================================================
    // LISTAGENS
    // =====================================================

    public List<OcorrenciaDTO> listar() {

        return ocorrenciaRepository.findAll()
                .stream()
                .map(this::converter)
                .toList();
    }

    public List<OcorrenciaDTO> listarPorAluno(
            Integer alunoId
    ) {

        return ocorrenciaRepository.findByAluno_Id(alunoId)
                .stream()
                .map(this::converter)
                .toList();
    }

    public List<OcorrenciaDTO> listarPorProfessor(
            Integer professorId
    ) {

        return ocorrenciaRepository
                .findByProfessor_Id(professorId)
                .stream()
                .map(this::converter)
                .toList();
    }

    public List<OcorrenciaDTO> listarPorStatus(
            String status
    ) {

        return ocorrenciaRepository.findByStatus(
                        StatusOcorrencia.valueOf(status)
                )
                .stream()
                .map(this::converter)
                .toList();
    }

    // =====================================================
    // STATUS
    // =====================================================

    public OcorrenciaDTO alterarStatus(
            Integer id,
            String status,
            String respostaGestor
    ) {
        Ocorrencia ocorrencia =
                ocorrenciaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Ocorrência não encontrada"
                                )
                        );

        StatusOcorrencia novoStatus;

        try {
            novoStatus = StatusOcorrencia.valueOf(status);
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido"
            );
        }

        boolean finalizando =
                novoStatus == StatusOcorrencia.RESOLVIDA ||
                        novoStatus == StatusOcorrencia.CANCELADA;

        if (finalizando && (respostaGestor == null || respostaGestor.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe uma resposta/motivo para finalizar a ocorrência"
            );
        }

        ocorrencia.setStatus(novoStatus);
        ocorrencia.setDataAtualizacao(LocalDateTime.now());

        if (respostaGestor != null && !respostaGestor.isBlank()) {
            ocorrencia.setRespostaGestor(respostaGestor.trim());
        }

        return converter(
                ocorrenciaRepository.save(ocorrencia)
        );
    }

    // =====================================================
    // MÉTRICAS
    // =====================================================

    public Long totalOcorrencias() {

        return ocorrenciaRepository.count();
    }

    public Long totalPendentes() {

        return ocorrenciaRepository.countByStatus(
                StatusOcorrencia.PENDENTE
        );
    }

    public Long totalResolvidas() {

        return ocorrenciaRepository.countByStatus(
                StatusOcorrencia.RESOLVIDA
        );
    }

    // =====================================================
    // CONVERSOR
    // =====================================================

    private OcorrenciaDTO converter(
            Ocorrencia ocorrencia
    ) {
        return new OcorrenciaDTO(
                ocorrencia.getId(),

                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno().getId()
                        : null,

                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno()
                        .getUsuario()
                        .getNome()
                        : null,

                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor().getId()
                        : null,

                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor()
                        .getUsuario()
                        .getNome()
                        : null,

                ocorrencia.getTitulo(),

                ocorrencia.getDescricao(),

                ocorrencia.getTipo().name(),

                ocorrencia.getGravidade().name(),

                ocorrencia.getStatus().name(),

                ocorrencia.getDataOcorrencia(),

                ocorrencia.getRespostaGestor(),

                ocorrencia.getDataAtualizacao()
        );
    }

    public List<OcorrenciaDTO> listarPorTipo(
            String tipo
    ) {

        return ocorrenciaRepository.findByTipo(
                        TipoOcorrencia.valueOf(tipo)
                )
                .stream()
                .map(this::converter)
                .toList();
    }

    public OcorrenciaMetricasDTO metricas() {

        Long total =
                ocorrenciaRepository.count();

        Long pendentes =
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.PENDENTE
                );

        Long resolvidas =
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.RESOLVIDA
                );

        Long graves =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.ALTA
                );

        Long medias =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.MEDIA
                );

        Long leves =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.BAIXA
                );

        return new OcorrenciaMetricasDTO(
                total,
                pendentes,
                resolvidas,
                graves,
                medias,
                leves
        );
    }

    public OcorrenciaDTO editarPorProfessor(
            Integer usuarioId,
            Integer ocorrenciaId,
            OcorrenciaDTO dto
    ) {
        Professor professor = professorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Professor não encontrado"
                        )
                );

        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Ocorrência não encontrada"
                        )
                );

        if (!ocorrencia.getProfessor().getId().equals(professor.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não pode editar uma ocorrência de outro professor"
            );
        }

        if (ocorrencia.getStatus() != StatusOcorrencia.PENDENTE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Só é possível editar ocorrências pendentes"
            );
        }

        Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aluno não encontrado"
                        )
                );

        ocorrencia.setAluno(aluno);
        ocorrencia.setTitulo(dto.getTitulo());
        ocorrencia.setDescricao(dto.getDescricao());
        ocorrencia.setTipo(TipoOcorrencia.valueOf(dto.getTipo()));
        ocorrencia.setGravidade(GravidadeOcorrencia.valueOf(dto.getGravidade()));

        return converter(
                ocorrenciaRepository.save(ocorrencia)
        );
    }
}