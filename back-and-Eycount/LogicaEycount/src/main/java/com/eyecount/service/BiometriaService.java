package com.eyecount.service;

import com.eyecount.dto.biometria.BiometriaCadastroDTO;
import com.eyecount.dto.biometria.BiometriaResponseDTO;
import com.eyecount.model.Biometria;
import com.eyecount.model.Usuario;
import com.eyecount.repository.BiometriaRepository;
import com.eyecount.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BiometriaService {

    private final BiometriaRepository biometriaRepository;
    private final UsuarioRepository usuarioRepository;

    public BiometriaResponseDTO cadastrar(BiometriaCadastroDTO dto) {
        if (dto.getUsuarioId() == null || dto.getEmbeddingFacial() == null || dto.getEmbeddingFacial().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da biometria incompletos"
            );
        }

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"
                ));

        Biometria biometria = biometriaRepository
                .findByUsuario_IdAndTipo(dto.getUsuarioId(), "face")
                .orElse(new Biometria());

        biometria.setUsuario(usuario);
        biometria.setEmbeddingFacial(dto.getEmbeddingFacial());
        biometria.setTipo("face");
        biometria.setAtivo(true);

        return toDTO(biometriaRepository.save(biometria));
    }

    public List<BiometriaResponseDTO> listarAtivos() {
        return biometriaRepository.findByAtivoTrue()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private BiometriaResponseDTO toDTO(Biometria biometria) {
        return new BiometriaResponseDTO(
                biometria.getId(),
                biometria.getUsuario().getId(),
                biometria.getUsuario().getNome(),
                biometria.getUsuario().getPerfil().getNome(),
                biometria.getEmbeddingFacial(),
                biometria.getAtivo()
        );
    }
}