package prezence.dto.disciplina;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DisciplinaDTO {

    private Integer id;

    @NotBlank(message = "Nome da disciplina obrigatório")
    @Size(max = 100, message = "Nome da disciplina muito longo")
    private String nome;

    @Size(max = 10, message = "A sigla deve possuir no máximo 10 caracteres")
    private String sigla;

    public DisciplinaDTO(
            Integer id,
            String nome
    ) {
        this.id = id;
        this.nome = nome;
    }

    public DisciplinaDTO(
            Integer id,
            String nome,
            String sigla
    ) {
        this.id = id;
        this.nome = nome;
        this.sigla = sigla;
    }
}