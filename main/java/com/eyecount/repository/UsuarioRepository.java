package com.eyecount.repository;

import com.eyecount.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);
}
/*  já entrega automaticamente:
    findAll()
    findById()
    save()
    deleteById()
  já criam:
    findByEmail(String email)
    que será útil no login depois.
*/