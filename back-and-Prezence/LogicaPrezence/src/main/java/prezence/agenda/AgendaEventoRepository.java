package prezence.agenda;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AgendaEventoRepository
    extends JpaRepository<AgendaEvento, Long>, JpaSpecificationExecutor<AgendaEvento> { }
