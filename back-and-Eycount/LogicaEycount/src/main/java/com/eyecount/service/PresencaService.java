package com.eyecount.service;

import com.eyecount.dto.presenca.PresencaDTO;
import com.eyecount.model.*;
import com.eyecount.repository.AlunoRepository;
import com.eyecount.repository.AulaRepository;
import com.eyecount.repository.PresencaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
@Service
@RequiredArgsConstructor
public class PresencaService {

    private final PresencaRepository presencaRepository;
    private final AulaRepository aulaRepository;
    private final AlunoRepository alunoRepository;

    public Presenca registrar(PresencaDTO dto) {
        if (
                dto.getAlunoId() == null ||
                        dto.getAulaId() == null ||
                        dto.getStatus() == null ||
                        dto.getMetodo() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da presença incompletos"
            );
        }

        Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aluno não encontrado"
                ));

        Aula aula = aulaRepository.findById(dto.getAulaId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aula não encontrada"
                ));

        if (aula.getStatus() != StatusAula.EM_ANDAMENTO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível registrar presença em aula encerrada"
            );
        }

        Integer turmaDoAlunoId = aluno.getTurma().getId();

        Integer turmaDaAulaId = aula
                .getTurmaDisciplina()
                .getTurma()
                .getId();

        if (!turmaDoAlunoId.equals(turmaDaAulaId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não pertence à turma desta aula"
            );
        }

        Presenca presenca = presencaRepository
                .findByAluno_IdAndAula_Id(dto.getAlunoId(), dto.getAulaId())
                .orElse(new Presenca());

        presenca.setAluno(aluno);
        presenca.setAula(aula);
        presenca.setStatus(dto.getStatus());
        presenca.setMetodo(dto.getMetodo());
        presenca.setHorarioRegistro(LocalDateTime.now());

        presenca.setValidacaoBiometrica(
                dto.getMetodo() == MetodoPresenca.BIOMETRIA
        );

        return presencaRepository.save(presenca);
    }
}