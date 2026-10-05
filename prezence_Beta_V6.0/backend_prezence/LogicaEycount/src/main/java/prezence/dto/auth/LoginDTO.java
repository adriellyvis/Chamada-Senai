package prezence.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class LoginDTO {

    @NotBlank
    @JsonAlias({
            "email",
            "ra",
            "matricula"
    })
    private String identificador;


    private String digitoRa;

    private String uf;


    @NotBlank
    private String senha;
}