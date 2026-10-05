package prezence.dto.aviso;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvisoDTO {

    private Integer id;
    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String alunoNome;
    private Integer autorUsuarioId;
    private String autorNome;
    private String autorPerfil;
    private Integer turmaId;
    private String turmaNome;
    private String titulo;
    private String mensagem;
    private String categoria;
    private String prioridade;
    private Boolean lido;
    private Double frequencia;
    private Double nota;
    private String melhorias;
    private LocalDateTime dataCriacao;
}