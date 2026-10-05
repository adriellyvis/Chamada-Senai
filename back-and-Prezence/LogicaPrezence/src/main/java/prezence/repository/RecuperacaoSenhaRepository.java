package prezence.repository;

import prezence.model.RecuperacaoSenha;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface RecuperacaoSenhaRepository
        extends JpaRepository<RecuperacaoSenha, Integer> {

    Optional<RecuperacaoSenha>
    findByChallengeId(
            String challengeId
    );
}