package com.eyecount.repository;

import com.eyecount.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlunoRepository extends JpaRepository<Aluno, Integer> {
    List<Aluno> findByTurmaId(Integer turmaId);

}