package prezence.dto.nota;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotaDTO {

    private Integer id;

    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String alunoNome;

    private Integer turmaDisciplinaId;

    private Integer turmaId;
    private String turmaNome;

    private Integer disciplinaId;
    private String disciplinaNome;

    private String titulo;

    private Double nota;
    private Double notaMaxima;

    private Integer bimestre;

    private String observacao;

    private LocalDate dataAvaliacao;
    private LocalDateTime dataCriacao;
}