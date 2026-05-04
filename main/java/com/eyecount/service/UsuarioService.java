package com.eyecount.service;

import com.eyecount.model.Aula;
import com.eyecount.model.StatusAula;
import com.eyecount.model.TurmaDisciplina;
import com.eyecount.model.Usuario;
import com.eyecount.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }



}
/*O que isso faz

Aqui cria a primeira regra funcional do backend:
listar usuários

O service chama o repository
e devolve os dados.
*/