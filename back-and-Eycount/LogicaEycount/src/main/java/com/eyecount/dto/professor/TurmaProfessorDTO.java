package com.eyecount.dto.professor;

public record TurmaProfessorDTO(
        Integer turmaDisciplinaId,
        Integer turmaId,
        String nomeTurma,
        String disciplina,
        Long totalAlunos,
        String sala
) {
}