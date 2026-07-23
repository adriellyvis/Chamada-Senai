package eyecount.service;

import eyecount.dto.auth.LoginDTO;
import eyecount.dto.auth.LoginResponseDTO;
import eyecount.model.Usuario;
import eyecount.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/*
 * Servico responsavel pela autenticacao dos usuarios.
 *
 * Esta classe:
 * - recebe email e senha;
 * - busca o usuario no banco;
 * - valida a senha;
 * - verifica se o usuario esta ativo;
 * - devolve os dados basicos do usuario autenticado.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    // Repository usado para buscar usuarios cadastrados no banco.
    private final UsuarioRepository usuarioRepository;

    /*
     * Realiza o login do usuario.
     *
     * O metodo recebe os dados enviados pelo front,
     * valida email, senha e situacao do usuario.
     */
    public LoginResponseDTO login(LoginDTO dto) {

        /*
         * Remove espacos antes e depois do email.
         * Isso evita erro quando o usuario digita espacos sem perceber.
         */
        String email = dto.getEmail().trim();

        /*
         * Remove espacos antes e depois da senha.
         *
         * Observacao:
         * senhas podem conter espacos validos em alguns sistemas.
         * Aqui, o codigo atual remove esses espacos.
         */
        String senha = dto.getSenha().trim();

        /*
         * Busca o usuario pelo email informado.
         *
         * Caso o email nao exista no banco,
         * retorna erro 401 com mensagem generica.
         */
        Usuario usuario = usuarioRepository
                .findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email ou senha inválidos"
                ));

        /*
         * Compara a senha recebida com a senha armazenada.
         *
         * Caso sejam diferentes, retorna erro 401.
         */
        if (!usuario.getSenha().equals(senha)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email ou senha inválidos"
            );
        }

        /*
         * Impede o login quando o usuario esta desativado.
         *
         * Nesse caso, o sistema retorna erro 403.
         */
        if (!usuario.getAtivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuário inativo"
            );
        }

        /*
         * Monta a resposta enviada ao front apos o login.
         *
         * Sao retornados:
         * - ID do usuario;
         * - nome;
         * - email;
         * - nome do perfil.
         */
        return new LoginResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil().getNome()
        );
    }
}