package com.eyecount.service;

import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import com.eyecount.dto.aula.HistoricoAulaDTO;
import com.eyecount.dto.dashboard.FrequenciaTurmaDTO;
import com.eyecount.dto.professor.*;
import com.eyecount.model.Aluno;
import com.eyecount.model.Aula;
import com.eyecount.model.Professor;
import com.eyecount.model.StatusAula;
import com.eyecount.model.TurmaDisciplina;
import com.eyecount.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfessorService {
    private final ProfessorRepository professorRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final AlunoRepository alunoRepository;
    private final AulaRepository aulaRepository;
    private final PresencaRepository presencaRepository;

    // =====================================================
    // PROFESSOR
    // =====================================================
    public ProfessorDashboardDTO dashboard(
            Integer usuarioId
    ) {
        Professor professor = buscarProfessorPorUsuario(usuarioId);

        List<TurmaDisciplina> vinculos = turmaDisciplinaRepository.findByProfessorId(professor.getId());

        Integer totalTurmas = vinculos.size();

        Integer totalAlunos = vinculos.stream().map(v -> alunoRepository
                .findByTurmaId(v.getTurma().getId()).size())
                .reduce(0, Integer::sum);

        List<HistoricoAulaDTO> historico = aulaRepository.buscarHistoricoPorProfessor(usuarioId);

        Integer aulasRealizadas = historico.size();

        Double frequenciaMedia = presencaRepository.calcularFrequenciaPorProfessor(professor.getId());

        if (frequenciaMedia == null) {
            frequenciaMedia = 0.0;
        }

        List<HistoricoAulaDTO> aulasRecentes =
                historico.stream()
                        .limit(5)
                        .toList();

        List<AlertaEvasaoDTO> alunosRisco =
                presencaRepository
                        .buscarAlunosRiscoProfessor(
                                professor.getId()
                        );

        return new ProfessorDashboardDTO(
                totalTurmas,
                totalAlunos,
                Math.round(frequenciaMedia * 10.0) / 10.0,
                aulasRealizadas,
                aulasRecentes,
                alunosRisco
        );
    }
    public Professor buscarProfessorPorUsuario(Integer usuarioId) {
        return professorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Professor não encontrado"
                        )
                );
    }

    // =====================================================
    // TURMAS
    // =====================================================
    public List<TurmaProfessorDTO> listarTurmas(
            Integer usuarioId
    ) {
        return turmaDisciplinaRepository.buscarTurmasDoProfessorComResumo(usuarioId);
    }

    public List<Aluno> listarAlunos(
            Integer turmaDisciplinaId
    ) {
        TurmaDisciplina turmaDisciplina = turmaDisciplinaRepository.findById(turmaDisciplinaId)
                        .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Turma/Disciplina não encontrada"
                                )
                        );

        return alunoRepository.findByTurmaId(turmaDisciplina.getTurma().getId()
        );
    }

    public List<FrequenciaTurmaDTO> buscarFrequenciaTurmas(
            Integer usuarioId
    ) {
        Professor professor = buscarProfessorPorUsuario(usuarioId);

        return presencaRepository.buscarFrequenciaTurmasProfessor(
                        professor.getId()
                );
    }
    // =====================================================
    // AULAS
    // =====================================================
    public Aula encerrarAula(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aula não encontrada"
                        )
                );

        aula.setHoraFim(LocalTime.now());
        aula.setStatus(StatusAula.ENCERRADA);

        return aulaRepository.save(aula);
    }

    public List<HistoricoAulaDTO> listarHistorico(
            Integer usuarioId
    ) {

        return aulaRepository   .buscarHistoricoPorProfessor(usuarioId);
    }

    public List<DesempenhoTurmaDTO> desempenhoTurmas(
            Integer usuarioId,
            Integer turmaId,
            String periodo
    ) {
        return presencaRepository.buscarDesempenhoTurmas(
                usuarioId,
                turmaId
        );
    }

    public List<AlunoProfessorDTO> listarAlunosProfessor(
            Integer usuarioId,
            Integer turmaId
    ) {
        return alunoRepository.buscarAlunosDoProfessor(
                usuarioId,
                turmaId
        );
    }

    public List<PresencaAlunoProfessorDTO> listarPresencasDaAula(Integer aulaId) {
        return presencaRepository.findByAula_Id(aulaId)
                .stream()
                .map(p -> new PresencaAlunoProfessorDTO(
                        p.getAluno().getId(),
                        p.getAluno().getUsuario().getNome(),
                        p.getStatus() != null ? p.getStatus().name() : "NAO_REGISTRADO",
                        p.getMetodo() != null ? p.getMetodo().name() : "NAO_INFORMADO",
                        Boolean.TRUE.equals(p.getValidacaoBiometrica())
                ))
                .toList();
    }
}