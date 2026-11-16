from backend.app.metrics import MetricsBuffer, sample_once


def test_buffer_snapshot_shapes_match():
    buf = MetricsBuffer(maxlen=5)
    for i in range(7):
        buf.append(cpu_pct=i, ram_vm_gb=5.0, ram_java_gb=4.0)
    snap = buf.snapshot()
    assert len(snap["cpu"]) == 5
    assert len(snap["labels"]) == len(snap["cpu"]) == len(snap["ram_vm_gb"]) == len(snap["ram_java_gb"])


def test_sample_once_returns_zero_java_ram_when_process_not_found(monkeypatch):
    import backend.app.metrics as m
    monkeypatch.setattr(m, "_find_java_process", lambda: None)
    cpu, ram_vm, ram_java = sample_once()
    assert ram_java == 0.0
    assert isinstance(cpu, float) and isinstance(ram_vm, float)
