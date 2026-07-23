package eyecount.dto.aula;

import eyecount.model.StatusAula;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO ChamadaAbertaProfessorDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

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
