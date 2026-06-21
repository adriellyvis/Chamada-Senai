package com.eyecount.service;

import com.eyecount.dto.aluno.AlunoDashboardDTO;
import com.eyecount.dto.aluno.ChamadaAbertaAlunoDTO;
import com.eyecount.dto.aluno.HistoricoPresencaDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.model.*;
import com.eyecount.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@AllArgsConstructor
public class AlunoService {
    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final AulaRepository aulaRepository;

    // =====================================================
    // SEGURANÇA
    // =====================================================
    public void validarAluno(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuário não encontrado"
                        )
                );

        if (usuario.getPerfil().getId() != 1) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        }
    }
    // =====================================================
    // BUSCAS
    // =====================================================
    public Aluno buscarAlunoPorUsuario(
            Integer usuarioId
    ) {
        return alunoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aluno não encontrado"
                        )
                );
    }

    // =====================================================
    // DASHBOARD
    // =====================================================
    public AlunoDashboardDTO dashboard(
            Integer usuarioId
    ) {

        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        Long presencas = presencaRepository
                .countByAluno_IdAndStatus(
                        aluno.getId(),
                        StatusPresenca.PRESENTE
                );

        Long faltas = presencaRepository
                .countByAluno_IdAndStatus(
                        aluno.getId(),
                        StatusPresenca.AUSENTE
                );

        Long total = presencas + faltas;

        double frequencia = 0.0;
        if (total > 0) {
            frequencia = (presencas * 100.0) / total;
        }

        String risco;

        if (frequencia < 50) {
            risco = "alto";
        } else if (frequencia < 75) {
            risco = "medio";
        } else {
            risco = "baixo";
        }

        int ocorrencias = ocorrenciaRepository.findByAluno_Id(aluno.getId()).size();

        return new AlunoDashboardDTO(
                aluno.getUsuario().getNome(),
                aluno.getTurma().getNome(),
                aluno.getMatricula(),
                Math.round(frequencia * 10.0) / 10.0,
                presencas.intValue(),
                faltas.intValue(),
                ocorrencias,
                risco
        );
    }

    // =====================================================
    // HISTÓRICO
    // =====================================================
    public List<HistoricoPresencaDTO> historico(
            Integer usuarioId
    ) {
        Aluno aluno = buscarAlunoPorUsuario(usuarioId);
        return presencaRepository.buscarHistoricoAluno(aluno.getId());
    }

    // =====================================================
    // OCORRÊNCIAS
    // =====================================================
    public List<OcorrenciaDTO> ocorrencias(
            Integer usuarioId
    ) {

        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        return ocorrenciaRepository
                .findByAluno_Id(aluno.getId())
                .stream()
                .map(this::converterOcorrencia)
                .toList();
    }

    // =====================================================
    // PERFIL
    // =====================================================
    public Aluno perfil(Integer usuarioId) {
        return buscarAlunoPorUsuario(usuarioId);
    }

    // =====================================================
    // CONVERSOR
    // =====================================================
    private OcorrenciaDTO converterOcorrencia(Ocorrencia ocorrencia) {
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

    public ChamadaAbertaAlunoDTO buscarChamadaAberta(Integer usuarioId) {
        Aluno aluno = alunoRepository.findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aluno não encontrado para o usuário logado"
                ));

        List<Aula> aulasAbertas = aulaRepository.buscarAulaAbertaPorTurma(
                aluno.getTurma().getId(),
                StatusAula.EM_ANDAMENTO
        );

        if (aulasAbertas.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Nenhuma chamada aberta para sua turma no momento"
            );
        }

        Aula aula = aulasAbertas.get(0);

        return new ChamadaAbertaAlunoDTO(
                aluno.getId(),
                aula.getId(),
                aula.getTurmaDisciplina().getDisciplina().getNome(),
                aula.getTurmaDisciplina().getProfessor().getUsuario().getNome(),
                aula.getTurmaDisciplina().getTurma().getNome(),
                aula.getDataAula().toString(),
                aula.getHoraInicio().toString(),
                aula.getHoraFim() != null ? aula.getHoraFim().toString() : null,
                aula.getStatus().name()
        );
    }
}