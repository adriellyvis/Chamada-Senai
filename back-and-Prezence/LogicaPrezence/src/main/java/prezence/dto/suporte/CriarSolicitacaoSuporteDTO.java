package prezence.dto.suporte;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class CriarSolicitacaoSuporteDTO {

    @NotBlank
    @Size(max = 120)
    private String nome;


    @NotBlank
    @Email
    @Size(max = 160)
    private String email;


    @NotBlank
    @Size(max = 30)
    private String perfil;


    @NotBlank
    @Size(max = 120)
    private String assunto;


    @NotBlank
    @Size(max = 3000)
    private String mensagem;
}