package eyecount.inutilizados.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
/*
 * Arquivo legado ErroDTO. Classe antiga mantida apenas como referencia. Ela nao participa
 * do fluxo principal atual.
 */

@Getter
@AllArgsConstructor
public class ErroDTO {
    // Status atual do registro.
    private int status;
    // Campo mensagem usado por esta classe.
    private String mensagem;

}
