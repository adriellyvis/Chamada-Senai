package eyecount.service;

import eyecount.dto.biometria.BiometriaCadastroDTO;
import eyecount.dto.biometria.BiometriaResponseDTO;
import eyecount.model.Biometria;
import eyecount.model.Usuario;
import eyecount.repository.BiometriaRepository;
import eyecount.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/*
 * Servico responsavel pelas regras de negocio da biometria facial.
 *
 * Esta classe permite:
 * - cadastrar uma biometria facial;
 * - atualizar uma biometria ja existente;
 * - listar somente biometrias ativas;
 * - converter a entidade Biometria para o DTO enviado ao front.
 */
@Service
@RequiredArgsConstructor
public class BiometriaService {

    // Repository usado para consultar e salvar biometrias no banco.
    private final BiometriaRepository biometriaRepository;

    // Repository usado para localizar o usuario relacionado a biometria.
    private final UsuarioRepository usuarioRepository;

    /*
     * Cadastra ou atualiza a biometria facial de um usuario.
     *
     * Quando o usuario ja possui uma biometria do tipo face,
     * o registro existente e atualizado.
     *
     * Quando nao existe biometria facial, um novo registro e criado.
     */
    public BiometriaResponseDTO cadastrar(
            BiometriaCadastroDTO dto
    ) {

        /*
         * Valida os dados obrigatorios recebidos.
         *
         * O cadastro exige:
         * - ID do usuario;
         * - embedding facial preenchido;
         * - embedding facial diferente de texto vazio.
         */
        if (
                dto.getUsuarioId() == null ||
                        dto.getEmbeddingFacial() == null ||
                        dto.getEmbeddingFacial().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da biometria incompletos"
            );
        }

        /*
         * Busca o usuario pelo ID informado.
         *
         * Caso o usuario nao exista, retorna erro 404
         * e impede a criacao de uma biometria sem usuario.
         */
        Usuario usuario = usuarioRepository
                .findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"
                ));

        /*
         * Procura uma biometria:
         * - pertencente ao usuario informado;
         * - com tipo igual a "face".
         *
         * Se encontrar, atualiza o mesmo registro.
         * Se nao encontrar, cria uma nova entidade Biometria.
         */
        Biometria biometria = biometriaRepository
                .findByUsuario_IdAndTipo(
                        dto.getUsuarioId(),
                        "face"
                )
                .orElse(new Biometria());

        // Vincula a biometria ao usuario encontrado.
        biometria.setUsuario(usuario);

        /*
         * Salva o embedding facial recebido.
         *
         * O embedding representa os dados numericos
         * usados para identificar ou comparar o rosto.
         */
        biometria.setEmbeddingFacial(
                dto.getEmbeddingFacial()
        );

        // Define que este registro corresponde a biometria facial.
        biometria.setTipo("face");

        /*
         * Marca a biometria como ativa.
         *
         * Isso tambem reativa uma biometria antiga
         * caso ela ja existisse com ativo igual a false.
         */
        biometria.setAtivo(true);

        /*
         * Salva ou atualiza o registro no banco
         * e converte o resultado para BiometriaResponseDTO.
         */
        return toDTO(
                biometriaRepository.save(biometria)
        );
    }

    /*
     * Lista todas as biometrias ativas.
     *
     * Registros com ativo igual a false
     * nao aparecem no resultado.
     */
    public List<BiometriaResponseDTO> listarAtivos() {

        return biometriaRepository
                // Busca somente biometrias com ativo igual a true.
                .findByAtivoTrue()

                // Transforma a lista de entidades em um fluxo.
                .stream()

                // Converte cada entidade Biometria em BiometriaResponseDTO.
                .map(this::toDTO)

                // Monta a lista final que sera devolvida ao controller.
                .toList();
    }

    /*
     * Converte uma entidade Biometria para BiometriaResponseDTO.
     *
     * O DTO evita que a entidade completa seja enviada diretamente
     * para o front e seleciona apenas os dados necessarios.
     */
    private BiometriaResponseDTO toDTO(
            Biometria biometria
    ) {

        return new BiometriaResponseDTO(
                // ID do registro de biometria.
                biometria.getId(),

                // ID do usuario dono da biometria.
                biometria.getUsuario().getId(),

                // Nome do usuario relacionado.
                biometria.getUsuario().getNome(),

                // Nome do perfil do usuario, como aluno ou professor.
                biometria.getUsuario().getPerfil().getNome(),

                // Dados usados na comparacao facial.
                biometria.getEmbeddingFacial(),

                // Informa se a biometria esta ativa.
                biometria.getAtivo()
        );
    }
}