package eyecount.dto.ocorrencia;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
/*
 * DTO OcorrenciaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaDTO {
    // Identificador unico do registro.
    private Integer id;
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Campo alunoNome usado por esta classe.
    private String alunoNome;
    // Identificador usado para relacionar ou filtrar professor.
    private Integer professorId;
    // Campo professorNome usado por esta classe.
    private String professorNome;
    // Titulo resumido do registro.
    private String titulo;
    // Descricao detalhada do registro.
    private String descricao;
    // Tipo usado para classificar o registro.
    private String tipo;
    // Nivel de gravidade da ocorrencia.
    private String gravidade;
    // Status atual do registro.
    private String status;
    // Data e hora em que a ocorrencia foi registrada.
    private LocalDateTime dataOcorrencia;
    // Resposta ou justificativa informada pelo gestor.
    private String respostaGestor;
    // Data e hora da ultima atualizacao.
    private LocalDateTime dataAtualizacao;

}
