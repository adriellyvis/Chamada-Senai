package prezence.dto.aula;

import prezence.model.StatusAula;

import java.time.LocalDate;
import java.time.LocalTime;

public record ChamadaAbertaProfessorDTO(
        Integer aulaId,
        Integer turmaDisciplinaId,
        Integer turmaId,
        String turma,
        String disciplina,
        LocalDate data,
        LocalTime horaInicio,
        LocalTime horaFim,
        StatusAula status
) {
}
