package eyecount.dto.turma.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO CriarTurmaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarTurmaDTO {

    @NotBlank(message = "Nome da turma obrigatório")
    @Size(max = 100, message = "Nome da turma muito longo")
    private String nome;

    @NotBlank(message = "Descrição obrigatória")
    private String descricao;

    // Sala associada a turma.
    private String sala;

    // Data inicial do periodo.
    private LocalDate dataInicio;
    // Data prevista para o encerramento.
    private LocalDate dataFimPrevista;

    // Horario geral de inicio.
    private LocalTime horarioInicio;
    // Horario geral de termino.
    private LocalTime horarioFim;
}
