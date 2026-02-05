import piexif
from PIL import Image, PngImagePlugin, TiffImagePlugin
import hashlib
import io


def get_sha256_hash(file_bytes: bytes) -> str:
    """Generate a SHA-256 hash for the provided file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def extract_exif(image: Image.Image) -> dict:
    """
    Extract EXIF metadata from supported image formats (JPEG, PNG).
    """
    try:
        fmt = image.format.upper() if image.format else "UNKNOWN"
        exif_data = image.info.get("exif")
        
        if exif_data:
            return piexif.load(exif_data)
        
        if "PNG" in fmt:
            # Mask sensitive data but show general info
            info = {k: str(v) for k, v in image.info.items() if k != "exif"}
            return {"PNG Info": info} if info else {"Info": "No PNG chunks found."}
            
        return {"Format": fmt, "Message": "No EXIF metadata found in this image."}

    except Exception as e:
        return {"Error": f"Failed to parse EXIF: {str(e)}"}


def format_metadata(raw_exif: dict) -> dict:
    """
    Format raw EXIF data with readable tag names.
    Removes binary buffers and ensures JSON serialization safety.
    """
    formatted = {}
    
    # 1. Helper to safely converting bytes to string
    def safe_str(val):
        if isinstance(val, (bytes, bytearray)):
            try:
                return val.decode("utf-8").replace("\x00", "")
            except:
                return f"<binary: {len(val)} bytes>"
        if isinstance(val, (tuple, list)):
            # Special handling for GPS coordinates (rational numbers)
            # GPS coords are often stored as [(degrees, 1), (minutes, 1), (seconds, 100)]
            if len(val) > 0 and all(isinstance(v, (tuple, list)) and len(v) == 2 for v in val):
                try:
                    # Convert rational tuples to floats
                    decimals = [v[0] / v[1] if v[1] != 0 else v[0] for v in val]
                    # If it looks like DMS (degrees, minutes, seconds)
                    if len(decimals) == 3:
                        return decimals  # Return as array for frontend parsing
                    return decimals
                except:
                    pass
            return [safe_str(v) for v in val]
        return val

    # 2. Iterate and process
    for ifd_name, ifd_data in raw_exif.items():
        # Aggressive skip for thumbnail
        if ifd_name.lower().strip() == "thumbnail":
            continue

        if isinstance(ifd_data, dict):
            formatted[ifd_name] = {}
            for tag_id, tag_val in ifd_data.items():
                try:
                    # Resolve tag name if possible
                    tag_name = str(tag_id)
                    if ifd_name in piexif.TAGS and tag_id in piexif.TAGS[ifd_name]:
                        tag_name = piexif.TAGS[ifd_name][tag_id]["name"]
                    
                    formatted[ifd_name][tag_name] = safe_str(tag_val)
                except Exception:
                    # Fallback for weird tags
                    formatted[ifd_name][f"Tag {tag_id}"] = str(tag_val)
        else:
            # Handle top-level values (like '0th', '1st' if they weren't dicts, or others)
            formatted[ifd_name] = safe_str(ifd_data)

    return formatted


def strip_exif(image: Image.Image) -> io.BytesIO:
    """
    Strip EXIF metadata from an image and return cleaned image buffer.
    """
    clean_buffer = io.BytesIO()
    format_to_use = image.format.upper() if image.format else "JPEG"

    # Force fallback for unknown formats
    if format_to_use not in ["JPEG", "PNG", "TIFF", "BMP", "WEBP"]:
        format_to_use = "JPEG"

    # Strip logic
    save_kwargs = {}

    if format_to_use == "JPEG":
        save_kwargs["exif"] = b""
    elif format_to_use == "PNG":
        save_kwargs["pnginfo"] = PngImagePlugin.PngInfo()
    elif format_to_use == "TIFF":
        save_kwargs["tiffinfo"] = TiffImagePlugin.ImageFileDirectory_v2()
    elif format_to_use == "WEBP":
        save_kwargs["exif"] = b""

    try:
        image.save(clean_buffer, format=format_to_use, **save_kwargs)
        clean_buffer.seek(0)
        return clean_buffer
    except Exception as e:
        raise RuntimeError(f"Failed to clean image: {str(e)}")
