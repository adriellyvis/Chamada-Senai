package com.eyecount.service;

import com.eyecount.dto.turma.TurmaDTO;
import com.eyecount.model.Disciplina;
import com.eyecount.model.Professor;
import com.eyecount.model.Turma;
import com.eyecount.model.TurmaDisciplina;
import com.eyecount.repository.DisciplinaRepository;
import com.eyecount.repository.ProfessorRepository;
import com.eyecount.repository.TurmaDisciplinaRepository;
import com.eyecount.repository.TurmaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final ProfessorRepository professorRepository;
    private final DisciplinaRepository disciplinaRepository;

    public TurmaService(
            TurmaRepository turmaRepository,
            TurmaDisciplinaRepository turmaDisciplinaRepository,
            ProfessorRepository professorRepository,
            DisciplinaRepository disciplinaRepository
    ) {

        this.turmaRepository = turmaRepository;
        this.turmaDisciplinaRepository = turmaDisciplinaRepository;
        this.professorRepository = professorRepository;
        this.disciplinaRepository = disciplinaRepository;
    }

    public Turma cadastrar(TurmaDTO dto) {

        Turma turma = new Turma();

        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());
        turma.setSala(dto.getSala());
        turma.setHorarioInicio(dto.getHorarioInicio());
        turma.setHorarioFim(dto.getHorarioFim());
        turma.setAtivo(true);

        Turma turmaSalva = turmaRepository.save(turma);

        Professor professor = professorRepository.findById(dto.getProfessorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Professor não encontrado"
                ));

        Disciplina disciplina = disciplinaRepository.findById(dto.getDisciplinaId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Disciplina não encontrada"
                ));

        TurmaDisciplina td = new TurmaDisciplina();

        td.setTurma(turmaSalva);
        td.setProfessor(professor);
        td.setDisciplina(disciplina);

        turmaDisciplinaRepository.save(td);

        return turmaSalva;
    }

    public List<TurmaDTO> listar() {

        return turmaRepository.findAll()
                .stream()
                .map(turma -> {

                    TurmaDisciplina td = turmaDisciplinaRepository
                            .findFirstByTurmaId(turma.getId())
                            .orElse(null);

                    TurmaDTO dto = new TurmaDTO();

                    dto.setId(turma.getId());
                    dto.setNome(turma.getNome());
                    dto.setDescricao(turma.getDescricao());

                    dto.setSala(turma.getSala());
                    dto.setHorarioInicio(turma.getHorarioInicio());
                    dto.setHorarioFim(turma.getHorarioFim());
                    dto.setAtivo(turma.getAtivo());

                    if (td != null) {

                        dto.setProfessor(
                                td.getProfessor().getUsuario().getNome()
                        );

                        dto.setProfessorId(
                                td.getProfessor().getId()
                        );

                        dto.setDisciplina(
                                td.getDisciplina().getNome()
                        );

                        dto.setDisciplinaId(
                                td.getDisciplina().getId()
                        );
                    }

                    return dto;

                })
                .toList();
    }

    public Turma editar(Integer id, TurmaDTO dto) {

        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turma não encontrada"
                ));

        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());
        turma.setSala(dto.getSala());
        turma.setHorarioInicio(dto.getHorarioInicio());
        turma.setHorarioFim(dto.getHorarioFim());

        Turma turmaAtualizada = turmaRepository.save(turma);

        TurmaDisciplina td = turmaDisciplinaRepository
                .findFirstByTurmaId(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vínculo da turma não encontrado"
                ));

        Professor professor = professorRepository.findById(dto.getProfessorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Professor não encontrado"
                ));

        Disciplina disciplina = disciplinaRepository.findById(dto.getDisciplinaId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Disciplina não encontrada"
                ));

        td.setProfessor(professor);
        td.setDisciplina(disciplina);

        turmaDisciplinaRepository.save(td);

        return turmaAtualizada;
    }

    public Turma alterarStatus(Integer id) {

        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turma não encontrada"
                ));

        turma.setAtivo(!turma.getAtivo());

        return turmaRepository.save(turma);
    }
}