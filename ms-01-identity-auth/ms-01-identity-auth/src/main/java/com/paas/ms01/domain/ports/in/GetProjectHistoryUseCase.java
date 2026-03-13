package com.paas.ms01.domain.ports.in;

import com.paas.ms01.domain.model.ProjectHistoryItem;
import java.util.List;

public interface GetProjectHistoryUseCase {
    List<ProjectHistoryItem> getHistory();
}