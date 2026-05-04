package com.eyecount.controller;

import com.eyecount.dto.AlunoChamadaDTO;
import com.eyecount.dto.HistoricoAulaDTO;
import com.eyecount.dto.PresencaDTO;
import com.eyecount.model.*;
import com.eyecount.repository.*;
import com.eyecount.service.AulaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/professor")
public class ProfessorController {

    private final ProfessorRepository professorRepository;
    private final AlunoRepository alunoRepository;
    private final AulaRepository aulaRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final PresencaRepository presencaRepository;
    private final AulaService aulaService;
    private final UsuarioRepository usuarioRepository;

    public ProfessorController(
            ProfessorRepository professorRepository,
            AlunoRepository alunoRepository,
            AulaRepository aulaRepository,
            TurmaDisciplinaRepository turmaDisciplinaRepository,
            PresencaRepository presencaRepository,
            AulaService aulaService,
            UsuarioRepository usuarioRepository
    ) {
        this.professorRepository = professorRepository;
        this.alunoRepository = alunoRepository;
        this.aulaRepository = aulaRepository;
        this.turmaDisciplinaRepository = turmaDisciplinaRepository;
        this.presencaRepository = presencaRepository;
        this.aulaService = aulaService;
        this.usuarioRepository = usuarioRepository;
    }

    private void validarProfessor(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));

        if (usuario.getPerfil().getId() != 2) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        }
    }

    @GetMapping("/turmas/{usuarioId}")
    public ResponseEntity<List<TurmaDisciplina>> listarTurmas(
            @PathVariable Integer usuarioId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);

        if (!usuarioId.equals(headerUsuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso inválido");
        }

        Professor professor = professorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Professor não encontrado"));

        List<TurmaDisciplina> turmas = turmaDisciplinaRepository.findByProfessorId(professor.getId());

        return ResponseEntity.ok(turmas);
    }

    @GetMapping("/turma-disciplina/{turmaDisciplinaId}/alunos")
    public ResponseEntity<List<Aluno>> listarAlunos(
            @PathVariable Integer turmaDisciplinaId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);

        TurmaDisciplina turmaDisciplina = turmaDisciplinaRepository.findById(turmaDisciplinaId)
                .orElseThrow(() -> new RuntimeException("Turma/Disciplina não encontrada"));

        return ResponseEntity.ok(alunoRepository.findByTurmaId(turmaDisciplina.getTurma().getId()));
    }

    @PostMapping("/presenca")
    public ResponseEntity<?> registrarPresenca(
            @RequestBody PresencaDTO dto,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);

        Optional<Presenca> presencaExistente =
                presencaRepository.findByAluno_IdAndAula_Id(dto.getAlunoId(), dto.getAulaId());

        Presenca presenca;

        if (presencaExistente.isPresent()) {
            presenca = presencaExistente.get();
        } else {
            Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                    .orElseThrow(() -> new RuntimeException("Aluno não encontrado"));

            Aula aula = aulaRepository.findById(dto.getAulaId())
                    .orElseThrow(() -> new RuntimeException("Aula não encontrada"));

            presenca = new Presenca();
            presenca.setAluno(aluno);
            presenca.setAula(aula);
            presenca.setValidacaoBiometrica(false);
        }

        presenca.setStatus(StatusPresenca.valueOf(dto.getStatus()));
        presenca.setMetodo(MetodoPresenca.valueOf(dto.getMetodo()));
        presenca.setHorarioRegistro(LocalDateTime.now());

        presencaRepository.save(presenca);

        return ResponseEntity.ok("Presença registrada com sucesso");
    }

    @PostMapping("/aula/encerrar/{aulaId}")
    public ResponseEntity<?> encerrarAula(
            @PathVariable Integer aulaId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);

        Aula aula = aulaRepository.findById(aulaId)
                .orElseThrow(() -> new RuntimeException("Aula não encontrada"));

        aula.setHoraFim(LocalTime.now());
        aula.setStatus(StatusAula.encerrada);

        aulaRepository.save(aula);

        return ResponseEntity.ok(aula);
    }

    @GetMapping("/historico/{usuarioId}")
    public ResponseEntity<List<HistoricoAulaDTO>> listarHistorico(
            @PathVariable Integer usuarioId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);

        if (!usuarioId.equals(headerUsuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso inválido");
        }

        return ResponseEntity.ok(aulaRepository.buscarHistoricoPorProfessor(usuarioId));
    }

    @PostMapping("/abrir")
    public Aula abrirChamada(
            @RequestParam Integer turmaDisciplinaId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);
        return aulaService.abrirOuRetomarChamada(turmaDisciplinaId);
    }

    @GetMapping("/aula/{aulaId}/alunos")
    public ResponseEntity<List<AlunoChamadaDTO>> listarAlunosDaChamada(
            @PathVariable Integer aulaId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);
        return ResponseEntity.ok(aulaService.listarAlunosDaChamada(aulaId));
    }

    @GetMapping("/aula/{aulaId}/detalhes")
    public ResponseEntity<?> detalharAula(
            @PathVariable Integer aulaId,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarProfessor(headerUsuarioId);
        return ResponseEntity.ok(aulaService.listarDetalhesAula(aulaId));
    }
}