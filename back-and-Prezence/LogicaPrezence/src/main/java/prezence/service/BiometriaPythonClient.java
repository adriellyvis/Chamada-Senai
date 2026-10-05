package prezence.service;

import prezence.dto.biometria.BiometriaPythonValidacaoResponseDTO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;


@Service
public class BiometriaPythonClient {

    private final RestClient restClient;

    private final String serviceKey;

    private final String validarPath;


    public BiometriaPythonClient(

            RestClient.Builder restClientBuilder,

            @Value("${biometria.python-url:http://localhost:5000}")
            String pythonUrl,

            @Value("${biometria.service-key:}")
            String serviceKey,

            @Value("${biometria.validar-path:/biometria/validar}")
            String validarPath
    ) {

        this.restClient =
                restClientBuilder
                        .baseUrl(
                                pythonUrl
                        )
                        .build();

        this.serviceKey =
                serviceKey;

        this.validarPath =
                validarPath;
    }


    public BiometriaPythonValidacaoResponseDTO validar(
            Integer usuarioId,
            MultipartFile imagem
    ) {

        // =====================================================
        // VALIDAR ENTRADA
        // =====================================================

        if (
                usuarioId == null
                        ||
                        imagem == null
                        ||
                        imagem.isEmpty()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Imagem biométrica inválida"
            );
        }


        try {

            // =====================================================
            // PREPARAR IMAGEM
            // =====================================================

            byte[] bytes =
                    imagem.getBytes();


            String nomeArquivo =
                    imagem.getOriginalFilename();


            if (
                    nomeArquivo == null
                            ||
                            nomeArquivo.isBlank()
            ) {

                nomeArquivo =
                        "captura.jpg";
            }


            final String nomeFinal =
                    nomeArquivo;


            ByteArrayResource recursoImagem =
                    new ByteArrayResource(
                            bytes
                    ) {

                        @Override
                        public String getFilename() {

                            return nomeFinal;
                        }
                    };


            // =====================================================
            // MONTAR MULTIPART
            // =====================================================

            MultiValueMap<String, Object> body =
                    new LinkedMultiValueMap<>();


            body.add(
                    "usuarioId",
                    usuarioId.toString()
            );


            body.add(
                    "imagem",
                    recursoImagem
            );


            // =====================================================
            // CHAMAR PYTHON
            // =====================================================

            BiometriaPythonValidacaoResponseDTO resposta =
                    restClient
                            .post()
                            .uri(
                                    validarPath
                            )
                            .header(
                                    "X-Prezence-Service-Key",
                                    serviceKey
                            )
                            .contentType(
                                    MediaType.MULTIPART_FORM_DATA
                            )
                            .accept(
                                    MediaType.APPLICATION_JSON
                            )
                            .body(
                                    body
                            )
                            .retrieve()
                            .body(
                                    BiometriaPythonValidacaoResponseDTO.class
                            );


            // =====================================================
            // VALIDAR RESPOSTA
            // =====================================================

            if (resposta == null) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Serviço biométrico não retornou uma resposta válida"
                );
            }


            return resposta;


        } catch (IOException e) {

            // =====================================================
            // ERRO AO LER IMAGEM
            // =====================================================

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "ERRO AO PROCESSAR IMAGEM"
            );

            System.err.println(
                    e.getMessage()
            );

            System.err.println(
                    "========================================"
            );


            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não foi possível processar a imagem"
            );


        } catch (RestClientResponseException e) {

            // =====================================================
            // PYTHON RESPONDEU COM ERRO HTTP
            // =====================================================

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "ERRO RETORNADO PELO PYTHON"
            );

            System.err.println(
                    "STATUS: "
                            + e.getStatusCode()
            );

            System.err.println(
                    "RESPOSTA:"
            );

            System.err.println(
                    e.getResponseBodyAsString()
            );

            System.err.println(
                    "========================================"
            );


            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "O serviço biométrico recusou a requisição"
            );


        } catch (ResourceAccessException e) {

            // =====================================================
            // SPRING NÃO CONSEGUIU CONECTAR AO PYTHON
            // =====================================================

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "NÃO FOI POSSÍVEL CONECTAR AO PYTHON"
            );

            System.err.println(
                    e.getMessage()
            );

            System.err.println(
                    "========================================"
            );


            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível conectar ao serviço biométrico"
            );


        } catch (RestClientException e) {

            // =====================================================
            // OUTRO ERRO DE COMUNICAÇÃO
            // =====================================================

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "ERRO NA COMUNICAÇÃO COM O PYTHON"
            );

            System.err.println(
                    "TIPO: "
                            + e.getClass().getName()
            );

            System.err.println(
                    "MENSAGEM: "
                            + e.getMessage()
            );

            System.err.println(
                    "========================================"
            );


            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Serviço biométrico temporariamente indisponível"
            );
        }
    }
}