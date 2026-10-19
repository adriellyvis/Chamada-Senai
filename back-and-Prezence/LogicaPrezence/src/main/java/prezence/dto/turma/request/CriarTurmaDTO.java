package prezence.dto.turma.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarTurmaDTO {

    @NotBlank(message = "Nome da turma obrigatório")
    @Size(max = 100, message = "Nome da turma muito longo")
    private String nome;

    @NotBlank(message = "Descrição obrigatória")
    private String descricao;

    private String sala;

    private LocalDate dataInicio;

    private LocalDate dataFimPrevista;

    private LocalTime horarioInicio;

    private LocalTime horarioFim;

    /*
     * Professor e disciplina iniciais da turma.
     *
     * O vínculo será salvo em turma_disciplina.
     */
    @NotNull(message = "Professor responsável é obrigatório")
    private Integer professorId;

    @NotNull(message = "Disciplina é obrigatória")
    private Integer disciplinaId;
}