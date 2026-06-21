package com.eyecount.repository;

import com.eyecount.model.Biometria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BiometriaRepository extends JpaRepository<Biometria, Integer> {

    Optional<Biometria> findByUsuario_IdAndTipo(Integer usuarioId, String tipo);

    List<Biometria> findByAtivoTrue();
}