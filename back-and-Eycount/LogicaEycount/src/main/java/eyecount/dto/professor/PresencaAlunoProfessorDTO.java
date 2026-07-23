package eyecount.dto.professor;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO PresencaAlunoProfessorDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PresencaAlunoProfessorDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Campo alunoNome usado por esta classe.
    private String alunoNome;
    // Status atual do registro.
    private String status;
    // Metodo usado para realizar o registro.
    private String metodo;
    // Indica se o registro foi validado por biometria.
    private Boolean validacaoBiometrica;
}
