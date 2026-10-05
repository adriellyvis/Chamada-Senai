package prezence.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class BiometriaInternalAuthService {

    private final byte[] chaveEsperada;


    public BiometriaInternalAuthService(
            @Value("${biometria.service-key}")
            String chave
    ) {

        String chaveNormalizada =
                chave != null
                        ? chave.trim()
                        : null;

        if (
                chaveNormalizada == null
                        || chaveNormalizada.isBlank()
                        || chaveNormalizada.length() < 32
        ) {

            throw new IllegalStateException(
                    "BIOMETRIA_SERVICE_KEY não foi configurada "
                            + "ou possui tamanho insuficiente."
            );
        }

        this.chaveEsperada =
                chaveNormalizada.getBytes(
                        StandardCharsets.UTF_8
                );
    }


    public void validar(
            String chaveRecebida
    ) {

        if (
                chaveRecebida == null
                        || chaveRecebida.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso interno não autorizado"
            );
        }

        byte[] recebida =
                chaveRecebida
                        .trim()
                        .getBytes(
                                StandardCharsets.UTF_8
                        );

        boolean iguais =
                MessageDigest.isEqual(
                        this.chaveEsperada,
                        recebida
                );

        if (!iguais) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso interno não autorizado"
            );
        }
    }
}