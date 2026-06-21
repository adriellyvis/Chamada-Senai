package com.eyecount.service;

import com.eyecount.dto.disciplina.DisciplinaDTO;
import com.eyecount.model.Disciplina;
import com.eyecount.repository.DisciplinaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DisciplinaService {
    private final DisciplinaRepository disciplinaRepository;

    public DisciplinaService(
            DisciplinaRepository disciplinaRepository
    ) {
        this.disciplinaRepository = disciplinaRepository;
    }

    public List<DisciplinaDTO> listar() {

        return disciplinaRepository.findAll()
                .stream()
                .map(d -> new DisciplinaDTO(
                        d.getId(),
                        d.getNome()
                ))
                .toList();
    }

    public Disciplina cadastrar(DisciplinaDTO dto) {

        disciplinaRepository.findByNome(dto.getNome())
                .ifPresent(d -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Disciplina já cadastrada"
                    );
                });

        Disciplina disciplina = new Disciplina();
        disciplina.setNome(dto.getNome());

        return disciplinaRepository.save(disciplina);
    }

    public Disciplina editar(
            Integer id,
            DisciplinaDTO dto
    ) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Disciplina não encontrada"
                        )
                );

        disciplina.setNome(dto.getNome());

        return disciplinaRepository.save(disciplina);
    }

    public void deletar(Integer id) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Disciplina não encontrada"
                        )
                );

        disciplinaRepository.delete(disciplina);
    }
}