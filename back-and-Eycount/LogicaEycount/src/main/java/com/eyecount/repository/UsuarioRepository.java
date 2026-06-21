package com.eyecount.repository;

import com.eyecount.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);

    @Query("""
    SELECT COUNT(u)
    FROM Usuario u
    WHERE u.ativo = true
""")
    Long countUsuariosAtivos();

    @Query("""
    SELECT COUNT(u)
    FROM Usuario u
    WHERE u.ativo = true
    AND LOWER(u.perfil.nome) = 'professor'
""")
    Long countProfessoresAtivos();

    List<Usuario> findByPerfilId(Integer perfilId);

    Long countByAtivoTrue();

    Long countByAtivoTrueAndPerfil_Id(Integer perfilId);
}
