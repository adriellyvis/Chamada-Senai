package com.eyecount.service;

import com.eyecount.dto.aula.AlunoChamadaDTO;
import com.eyecount.dto.aula.DetalheAulaDTO;
import com.eyecount.model.*;
import com.eyecount.repository.AlunoRepository;
import com.eyecount.repository.AulaRepository;
import com.eyecount.repository.PresencaRepository;
import com.eyecount.repository.TurmaDisciplinaRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AulaService {

    private final AulaRepository aulaRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;

    public Aula abrirOuRetomarChamada(Integer turmaDisciplinaId) {
        LocalDate hoje = LocalDate.now();

        Optional<Aula> aulaEmAndamento = aulaRepository.findByTurmaDisciplina_IdAndStatus(
                turmaDisciplinaId,
                StatusAula.EM_ANDAMENTO
        );

        if (aulaEmAndamento.isPresent()) {
            return aulaEmAndamento.get();
        }

        TurmaDisciplina turmaDisciplina = turmaDisciplinaRepository.findById(turmaDisciplinaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turma/Disciplina não encontrada"
                ));

        Aula novaAula = new Aula();
        novaAula.setTurmaDisciplina(turmaDisciplina);
        novaAula.setDataAula(hoje);
        novaAula.setHoraInicio(LocalTime.now());
        novaAula.setStatus(StatusAula.EM_ANDAMENTO);

        Aula aulaSalva = aulaRepository.save(novaAula);

        criarPresencasIniciais(aulaSalva);

        return aulaSalva;
    }

    private void criarPresencasIniciais(Aula aula) {
        Integer turmaId = aula.getTurmaDisciplina().getTurma().getId();

        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);

        List<Presenca> presencas = alunos.stream()
                .map(aluno -> {
                    Presenca presenca = new Presenca();
                    presenca.setAluno(aluno);
                    presenca.setAula(aula);
                    presenca.setStatus(StatusPresenca.AUSENTE);
                    presenca.setMetodo(MetodoPresenca.MANUAL);
                    presenca.setValidacaoBiometrica(false);
                    return presenca;
                })
                .toList();

        presencaRepository.saveAll(presencas);
    }

    public List<AlunoChamadaDTO> listarAlunosDaChamada(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aula não encontrada"
                ));

        Integer turmaId = aula.getTurmaDisciplina().getTurma().getId();

        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);

        return alunos.stream().map(aluno -> {
            Optional<Presenca> presenca = presencaRepository.findByAluno_IdAndAula_Id(
                    aluno.getId(),
                    aulaId
            );

            String status = presenca
                    .map(p -> p.getStatus().name())
                    .orElse(StatusPresenca.AUSENTE.name());

            return new AlunoChamadaDTO(
                    aluno.getId(),
                    aluno.getUsuario().getNome(),
                    status
            );
        }).toList();
    }

    public List<DetalheAulaDTO> listarDetalhesAula(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aula não encontrada"
                ));

        List<Presenca> presencas = presencaRepository.findByAula_Id(aula.getId());

        return presencas.stream().map(p -> new DetalheAulaDTO(
                p.getAluno().getId(),
                p.getAluno().getUsuario().getNome(),
                p.getStatus().name(),
                p.getHorarioRegistro(),
                p.getMetodo().name()
        )).toList();
    }

    public Aula encerrarChamada(Integer aulaId) {
        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aula não encontrada"
                ));

        if (aula.getStatus() == StatusAula.ENCERRADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Essa chamada já foi encerrada"
            );
        }

        aula.setStatus(StatusAula.ENCERRADA);
        aula.setHoraFim(LocalTime.now());

        return aulaRepository.save(aula);
    }
}