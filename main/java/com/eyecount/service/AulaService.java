package com.eyecount.service;

import com.eyecount.dto.AlunoChamadaDTO;
import com.eyecount.dto.DetalheAulaDTO;
import com.eyecount.model.*;
import com.eyecount.repository.AlunoRepository;
import com.eyecount.repository.AulaRepository;
import com.eyecount.repository.PresencaRepository;
import com.eyecount.repository.TurmaDisciplinaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AulaService {
    private final AulaRepository aulaRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;

    public AulaService(
            AulaRepository aulaRepository,
            TurmaDisciplinaRepository turmaDisciplinaRepository,
            AlunoRepository alunoRepository,
            PresencaRepository presencaRepository
    ) {
        this.aulaRepository = aulaRepository;
        this.turmaDisciplinaRepository = turmaDisciplinaRepository;
        this.alunoRepository = alunoRepository;
        this.presencaRepository = presencaRepository;
    }

    public Aula abrirOuRetomarChamada(Integer turmaDisciplinaId) {
        LocalDate hoje = LocalDate.now();

        Optional<Aula> aulaExistente = aulaRepository
                .findByTurmaDisciplina_IdAndDataAulaAndStatus(
                        turmaDisciplinaId,
                        hoje,
                        StatusAula.em_andamento
                );

        if (aulaExistente.isPresent()) {
            return aulaExistente.get();
        }

        TurmaDisciplina turmaDisciplina = turmaDisciplinaRepository.findById(turmaDisciplinaId)
                .orElseThrow(() -> new RuntimeException("Turma/Disciplina não encontrada"));

        Aula novaAula = new Aula();
        novaAula.setTurmaDisciplina(turmaDisciplina);
        novaAula.setDataAula(hoje);
        novaAula.setHoraInicio(LocalTime.now());
        novaAula.setStatus(StatusAula.em_andamento);

        return aulaRepository.save(novaAula);
    }

    public List<AlunoChamadaDTO> listarAlunosDaChamada(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new RuntimeException("Aula não encontrada"));

        Integer turmaId = aula.getTurmaDisciplina().getTurma().getId();

        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);

        return alunos.stream().map(aluno -> {
            Optional<Presenca> presenca = presencaRepository
                    .findByAluno_IdAndAula_Id(aluno.getId(), aulaId);

            String status = presenca
                    .map(p -> p.getStatus().name())
                    .orElse(null);

            return new AlunoChamadaDTO(
                    aluno.getId(),
                    aluno.getUsuario().getNome(),
                    status
            );
        }).toList();
    }

    public List<DetalheAulaDTO> listarDetalhesAula(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new RuntimeException("Aula não encontrada"));

        List<Presenca> presencas = presencaRepository.findByAula_Id(aula.getId());

        return presencas.stream().map(p -> new DetalheAulaDTO(
                p.getAluno().getId(),
                p.getAluno().getUsuario().getNome(),
                p.getStatus().name(),
                p.getHorarioRegistro(),
                p.getMetodo().name()
        )).toList();
    }
}