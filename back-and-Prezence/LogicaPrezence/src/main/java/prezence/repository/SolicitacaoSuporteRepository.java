package prezence.repository;

import prezence.model.SolicitacaoSuporte;
import prezence.model.StatusSolicitacaoSuporte;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface SolicitacaoSuporteRepository
        extends JpaRepository<SolicitacaoSuporte, Integer> {

    List<SolicitacaoSuporte>
    findAllByOrderByDataCriacaoDesc();


    List<SolicitacaoSuporte>
    findByStatusOrderByDataCriacaoDesc(
            StatusSolicitacaoSuporte status
    );
}