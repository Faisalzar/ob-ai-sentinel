"""
Detection service tests
"""
import pytest
from backend.core.config import get_threat_level, DANGEROUS_CLASSES, CAUTION_CLASSES


def test_threat_level_dangerous():
    """Test dangerous threat classification"""
    dangerous_objects = ["gun", "pistol", "knife", "bomb", "explosive", "rifle"]
    
    for obj in dangerous_objects:
        assert get_threat_level(obj) == "dangerous"


def test_threat_level_caution():
    """Test caution threat classification"""
    caution_objects = ["person", "suspicious_object"]
    
    for obj in caution_objects:
        assert get_threat_level(obj) == "caution"


def test_threat_level_harmless():
    """Test harmless classification"""
    harmless_objects = ["car", "dog", "cat", "bottle", "phone"]
    
    for obj in harmless_objects:
        assert get_threat_level(obj) == "harmless"


def test_threat_level_case_insensitive():
    """Test that threat detection is case-insensitive"""
    assert get_threat_level("GUN") == "dangerous"
    assert get_threat_level("Gun") == "dangerous"
    assert get_threat_level("PERSON") == "caution"
    assert get_threat_level("Person") == "caution"


def test_threat_level_partial_match():
    """Test partial matching of dangerous terms"""
    assert get_threat_level("handgun") == "dangerous"  # Contains 'gun'
    assert get_threat_level("hunting_knife") == "dangerous"  # Contains 'knife'


def test_detection_summary():
    """Test detection summary generation"""
    from backend.services.ai_service import ai_service
    
    detections = [
        {
            "class_name": "gun",
            "confidence": "0.95",
            "bbox": {"x1": 100, "y1": 100, "x2": 200, "y2": 200},
            "threat_level": "dangerous"
        },
        {
            "class_name": "person",
            "confidence": "0.85",
            "bbox": {"x1": 50, "y1": 50, "x2": 150, "y2": 150},
            "threat_level": "caution"
        },
        {
            "class_name": "car",
            "confidence": "0.90",
            "bbox": {"x1": 300, "y1": 300, "x2": 400, "y2": 400},
            "threat_level": "harmless"
        }
    ]
    
    summary = ai_service.get_detection_summary(detections)
    
    assert summary["total_detections"] == 3
    assert summary["dangerous_count"] == 1
    assert summary["caution_count"] == 1
    assert summary["harmless_count"] == 1
    assert summary["has_dangerous_objects"] is True
    assert "gun" in summary["dangerous_objects"]
    assert len(summary["classes_detected"]) == 3


def test_detection_summary_empty():
    """Test detection summary with no detections"""
    from backend.services.ai_service import ai_service
    
    summary = ai_service.get_detection_summary([])
    
    assert summary["total_detections"] == 0
    assert summary["dangerous_count"] == 0
    assert summary["has_dangerous_objects"] is False
    assert len(summary["classes_detected"]) == 0
