"""Tests for project configuration and path setup."""

from pathlib import Path
from src import config


def test_project_root_exists():
    """Verify that PROJECT_ROOT is a valid directory."""
    assert config.PROJECT_ROOT.exists()
    assert config.PROJECT_ROOT.is_dir()


def test_core_directories_defined():
    """Verify core paths are Path instances and reside inside PROJECT_ROOT."""
    for directory in [
        config.DATA_DIR,
        config.MODELS_DIR,
        config.REPORTS_DIR,
        config.NOTEBOOKS_DIR,
        config.TESTS_DIR,
    ]:
        assert isinstance(directory, Path)
        assert directory.exists()
        assert directory.is_dir()


def test_schema_definitions():
    """Verify feature schema counts and column structures."""
    assert len(config.PCA_FEATURES) == 28
    assert config.PCA_FEATURES[0] == "V1"
    assert config.PCA_FEATURES[-1] == "V28"
    assert len(config.FEATURE_COLUMNS) == 30  # Time + 28 PCA features + Amount
    assert len(config.ALL_COLUMNS) == 31  # 30 features + Class
    assert config.TARGET_COLUMN == "Class"


def test_default_thresholds():
    """Verify threshold ordering and demonstration bounds."""
    assert 0.0 < config.DEFAULT_LOW_RISK_THRESHOLD < config.DEFAULT_HIGH_RISK_THRESHOLD < 1.0
