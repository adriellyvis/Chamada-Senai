package prezence.service;

import prezence.dto.biometria.BiometriaAmostraDTO;
import prezence.dto.biometria.BiometriaIdentidadeDTO;
import prezence.dto.biometria.CadastroBiometriaBancoDTO;
import prezence.model.Biometria;
import prezence.model.BiometriaAmostra;
import prezence.model.Usuario;
import prezence.repository.BiometriaAmostraRepository;
import prezence.repository.BiometriaRepository;
import prezence.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BiometriaBancoService {

    private static final int QUANTIDADE_AMOSTRAS = 5;

    /*
     * Limite de segurança por rosto já recortado.
     *
     * 2 MB por amostra é muito mais que suficiente
     * para nosso JPEG facial.
     */
    private static final int TAMANHO_MAXIMO_AMOSTRA =
            2 * 1024 * 1024;


    private final BiometriaRepository biometriaRepository;

    private final BiometriaAmostraRepository biometriaAmostraRepository;

    private final UsuarioRepository usuarioRepository;


    // =====================================================
    // CADASTRAR / RECADASTRAR BIOMETRIA
    // =====================================================

    @Transactional
    public void salvarAmostras(
            CadastroBiometriaBancoDTO dto
    ) {

        // =====================================================
        // VALIDAR REQUISIÇÃO
        // =====================================================

        validarCadastro(
                dto
        );


        // =====================================================
        // BUSCAR USUÁRIO
        // =====================================================

        Usuario usuario =
                usuarioRepository
                        .findById(
                                dto.getUsuarioId()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Usuário não encontrado"
                                )
                        );


        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível cadastrar biometria para usuário inativo"
            );
        }


        String tipo =
                dto.getTipo() == null
                        || dto.getTipo().isBlank()
                        ? "face"
                        : dto.getTipo().trim().toLowerCase();


        // =====================================================
        // BUSCAR OU CRIAR BIOMETRIA PRINCIPAL
        // =====================================================

        Biometria biometria =
                biometriaRepository
                        .findByUsuario_IdAndTipo(
                                usuario.getId(),
                                tipo
                        )
                        .orElseGet(
                                Biometria::new
                        );


        /*
         * Se for uma biometria nova,
         * vinculamos ao usuário.
         */
        if (biometria.getId() == null) {

            biometria.setUsuario(
                    usuario
            );
        }


        biometria.setTipo(
                tipo
        );

        biometria.setAtivo(
                true
        );


        /*
         * CAMPO LEGADO.
         *
         * Sua tabela atual exige embedding_facial NOT NULL.
         *
         * O reconhecimento novo NÃO usará esse valor.
         * Depois que toda a migração estiver pronta,
         * podemos remover esse campo.
         */
        biometria.setEmbeddingFacial(
                "AMOSTRAS_DB_V1"
        );


        /*
         * Caso sua entidade Biometria tenha setter para
         * dataCadastro, atualizamos no recadastro.
         *
         * Se não possuir setDataCadastro(), remova somente
         * estas 3 linhas.
         */
        biometria.setDataCadastro(
                LocalDateTime.now()
        );


        biometria =
                biometriaRepository.save(
                        biometria
                );


        // =====================================================
        // RECADASTRO
        // =====================================================

        /*
         * Muito importante:
         *
         * se a pessoa estiver recadastrando o rosto,
         * apagamos as 5 amostras antigas antes de inserir
         * as novas.
         *
         * A própria Biometria continua com o mesmo ID.
         */
        biometriaAmostraRepository
                .deleteByBiometria_Id(
                        biometria.getId()
                );


        /*
         * Força o DELETE antes dos novos INSERTs.
         *
         * Isso evita conflito na UNIQUE:
         * biometria_id + ordem_amostra
         */
        biometriaAmostraRepository.flush();


        // =====================================================
        // CONVERTER E SALVAR AS 5 AMOSTRAS
        // =====================================================

        List<BiometriaAmostra> entidades =
                new ArrayList<>();


        for (
                BiometriaAmostraDTO amostraDTO
                : dto.getAmostras()
        ) {

            byte[] imagem =
                    converterBase64(
                            amostraDTO.getImagemBase64()
                    );


            BiometriaAmostra amostra =
                    new BiometriaAmostra();


            amostra.setBiometria(
                    biometria
            );


            amostra.setOrdemAmostra(
                    amostraDTO.getOrdemAmostra()
            );


            amostra.setEtapa(
                    normalizarEtapa(
                            amostraDTO.getEtapa(),
                            amostraDTO.getOrdemAmostra()
                    )
            );


            amostra.setImagemFace(
                    imagem
            );


            entidades.add(
                    amostra
            );
        }


        biometriaAmostraRepository
                .saveAll(
                        entidades
                );


        biometriaAmostraRepository.flush();
    }


    // =====================================================
    // BUSCAR AS AMOSTRAS DE UM USUÁRIO
    // =====================================================

    @Transactional(readOnly = true)
    public CadastroBiometriaBancoDTO buscarAmostras(
            Integer usuarioId
    ) {

        if (usuarioId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário não informado"
            );
        }


        Usuario usuario =
                usuarioRepository
                        .findById(
                                usuarioId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Usuário não encontrado"
                                )
                        );


        Biometria biometria =
                biometriaRepository
                        .findByUsuario_IdAndTipo(
                                usuario.getId(),
                                "face"
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Biometria facial não cadastrada"
                                )
                        );


        if (!Boolean.TRUE.equals(biometria.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Biometria facial não está ativa"
            );
        }


        List<BiometriaAmostra> amostras =
                biometriaAmostraRepository
                        .findByBiometria_IdOrderByOrdemAmostraAsc(
                                biometria.getId()
                        );


        if (amostras.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Nenhuma amostra facial encontrada"
            );
        }


        List<BiometriaAmostraDTO> resultado =
                amostras
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        BiometriaAmostra::getOrdemAmostra
                                )
                        )
                        .map(amostra ->
                                new BiometriaAmostraDTO(
                                        amostra.getOrdemAmostra(),
                                        amostra.getEtapa(),
                                        Base64.getEncoder()
                                                .encodeToString(
                                                        amostra.getImagemFace()
                                                )
                                )
                        )
                        .toList();


        CadastroBiometriaBancoDTO dto =
                new CadastroBiometriaBancoDTO();


        dto.setUsuarioId(
                usuarioId
        );

        dto.setTipo(
                biometria.getTipo()
        );

        dto.setAmostras(
                resultado
        );


        return dto;
    }


    // =====================================================
    // VERIFICAR SE POSSUI BIOMETRIA
    // =====================================================

    @Transactional(readOnly = true)
    public boolean possuiBiometria(
            Integer usuarioId
    ) {

        if (usuarioId == null) {
            return false;
        }


        var biometriaOptional =
                biometriaRepository
                        .findByUsuario_IdAndTipo(
                                usuarioId,
                                "face"
                        );


        if (biometriaOptional.isEmpty()) {
            return false;
        }


        Biometria biometria =
                biometriaOptional.get();


        if (!Boolean.TRUE.equals(biometria.getAtivo())) {
            return false;
        }


        List<BiometriaAmostra> amostras =
                biometriaAmostraRepository
                        .findByBiometria_IdOrderByOrdemAmostraAsc(
                                biometria.getId()
                        );


        return amostras.size()
                >= QUANTIDADE_AMOSTRAS;
    }


    // =====================================================
    // VALIDAR CADASTRO
    // =====================================================

    private void validarCadastro(
            CadastroBiometriaBancoDTO dto
    ) {

        if (dto == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados biométricos não informados"
            );
        }


        if (dto.getUsuarioId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário não informado"
            );
        }


        if (dto.getAmostras() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Amostras biométricas não informadas"
            );
        }


        if (
                dto.getAmostras().size()
                        != QUANTIDADE_AMOSTRAS
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O cadastro biométrico deve possuir exatamente 5 amostras"
            );
        }


        Set<Integer> ordens =
                new HashSet<>();


        for (
                BiometriaAmostraDTO amostra
                : dto.getAmostras()
        ) {

            if (
                    amostra == null
                            ||
                            amostra.getOrdemAmostra() == null
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Todas as amostras precisam possuir uma ordem"
                );
            }


            Integer ordem =
                    amostra.getOrdemAmostra();


            if (
                    ordem < 1
                            ||
                            ordem > QUANTIDADE_AMOSTRAS
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ordem das amostras deve estar entre 1 e 5"
                );
            }


            if (!ordens.add(ordem)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Existem amostras com ordem repetida"
                );
            }


            /*
             * Fazemos a validação do Base64 aqui também.
             *
             * Assim a transação é abortada antes de
             * substituir o cadastro antigo.
             */
            converterBase64(
                    amostra.getImagemBase64()
            );
        }


        /*
         * Temos exatamente cinco itens,
         * então precisam existir 1, 2, 3, 4 e 5.
         */
        for (
                int ordem = 1;
                ordem <= QUANTIDADE_AMOSTRAS;
                ordem++
        ) {

            if (!ordens.contains(ordem)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "As amostras devem possuir as ordens de 1 até 5"
                );
            }
        }
    }


    // =====================================================
    // BASE64 → BYTES
    // =====================================================

    private byte[] converterBase64(
            String imagemBase64
    ) {

        if (
                imagemBase64 == null
                        ||
                        imagemBase64.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Imagem biométrica vazia"
            );
        }


        String base64 =
                imagemBase64.trim();


        /*
         * Também aceitamos:
         *
         * data:image/jpeg;base64,/9j/...
         */
        int separador =
                base64.indexOf(",");


        if (
                base64.startsWith("data:")
                        &&
                        separador >= 0
        ) {

            base64 =
                    base64.substring(
                            separador + 1
                    );
        }


        final byte[] imagem;


        try {

            imagem =
                    Base64.getDecoder()
                            .decode(
                                    base64
                            );

        } catch (IllegalArgumentException erro) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Amostra facial contém Base64 inválido"
            );
        }


        if (imagem.length == 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Amostra facial está vazia"
            );
        }


        if (
                imagem.length
                        > TAMANHO_MAXIMO_AMOSTRA
        ) {

            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Amostra facial ultrapassa o tamanho permitido"
            );
        }


        return imagem;
    }


    // =====================================================
    // ETAPAS PADRÃO
    // =====================================================

    private String normalizarEtapa(
            String etapa,
            Integer ordem
    ) {

        if (
                etapa != null
                        &&
                        !etapa.isBlank()
        ) {

            String valor =
                    etapa
                            .trim()
                            .toUpperCase();


            if (valor.length() > 40) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nome da etapa biométrica muito grande"
                );
            }


            return valor;
        }


        return switch (ordem) {

            case 1 -> "FRENTE";

            case 2 -> "ESQUERDA";

            case 3 -> "DIREITA";

            case 4 -> "DISTANCIA";

            case 5 -> "VARIACAO";

            default -> "AMOSTRA";
        };
    }

    @Transactional(readOnly = true)
    public List<BiometriaIdentidadeDTO> listarIdentidadesFaciais() {

        List<BiometriaAmostra> amostras =
                biometriaAmostraRepository
                        .listarAmostrasAtivasPorTipo(
                                "face"
                        );


        Map<Integer, BiometriaIdentidadeDTO> identidades =
                new LinkedHashMap<>();


        for (BiometriaAmostra amostra : amostras) {

            Biometria biometria =
                    amostra.getBiometria();

            Usuario usuario =
                    biometria.getUsuario();


            BiometriaIdentidadeDTO identidade =
                    identidades.computeIfAbsent(
                            usuario.getId(),
                            usuarioId -> {

                                String perfil =
                                        usuario.getPerfil() != null
                                                ? usuario.getPerfil().getNome()
                                                : "usuario";


                                return new BiometriaIdentidadeDTO(
                                        usuario.getId(),
                                        usuario.getNome(),
                                        perfil,
                                        new ArrayList<>()
                                );
                            }
                    );


            identidade.getAmostras().add(
                    new BiometriaAmostraDTO(
                            amostra.getOrdemAmostra(),
                            amostra.getEtapa(),
                            Base64.getEncoder()
                                    .encodeToString(
                                            amostra.getImagemFace()
                                    )
                    )
            );
        }


        return new ArrayList<>(
                identidades.values()
        );
    }
}