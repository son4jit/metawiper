from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image, UnidentifiedImageError
import io
import os

from utils.metadata_tools import (
    get_sha256_hash,
    extract_exif,
    format_metadata,
    strip_exif
)

# ---- Flask app ----
app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)

# 200MB upload limit
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024


# ---- Routes ----
@app.route("/", methods=["GET", "POST"])
def index():
    result = {}

    if request.method == "POST":
        # Check for AJAX header OR form flag
        is_ajax = (request.headers.get("X-Requested-With") == "XMLHttpRequest") or (request.form.get("ajax") == "true")

        file = request.files.get("image")

        if not file or file.filename == "":
            result["error"] = "No file uploaded"
            if is_ajax:
                return jsonify(result), 400
            return render_template("index.html", result=result)

        try:
            file_bytes = file.read()
            Image.MAX_IMAGE_PIXELS = None

            # Open image to verify it's valid
            image = Image.open(io.BytesIO(file_bytes))
            image_format = image.format or "JPEG"
            image.load()

            raw_exif = extract_exif(image)
            formatted_exif = format_metadata(raw_exif)

            result = {
                "hash": get_sha256_hash(file_bytes),
                "metadata": formatted_exif,
                "filename": file.filename,
                "format": image_format
            }

            if is_ajax:
                return jsonify(result)

        except UnidentifiedImageError:
            result["error"] = "Unsupported or corrupted image file"
            if is_ajax:
                return jsonify(result), 400

        except Exception as e:
            result["error"] = f"Failed to process image: {str(e)}"
            if is_ajax:
                return jsonify(result), 500

    return render_template("index.html", result=result)


@app.route("/strip", methods=["POST"])
def strip_metadata():
    file = request.files.get("image")

    if not file or file.filename == "":
        return "No file uploaded", 400

    try:
        image = Image.open(file.stream)
        image.load()

        clean_buffer = strip_exif(image)

        filename, ext = os.path.splitext(file.filename)
        ext = ext.lower() if ext else ".jpg"

        mimetype = f"image/{ext.replace('.', '')}"
        if ext in [".jpg", ".jpeg"]:
            mimetype = "image/jpeg"

        return send_file(
            clean_buffer,
            as_attachment=True,
            download_name=f"{filename}_cleaned{ext}",
            mimetype=mimetype
        )

    except Exception as e:
        return f"Failed to clean image: {str(e)}", 500


# ---- Error Handlers ----
@app.errorhandler(Exception)
def handle_exception(e):
    # Pass through HTTP errors
    if isinstance(e, UnidentifiedImageError):
        return jsonify({"error": "Corrupted or unsupported image file"}), 400
        
    # Generic error handling
    is_ajax = (request.headers.get("X-Requested-With") == "XMLHttpRequest") or (request.form.get("ajax") == "true")
    if is_ajax:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
        
    return f"Server Error: {str(e)}", 500

# ---- Run ----
if __name__ == "__main__":
    # In production (Render, etc.), a WSGI server like Gunicorn will use the 'app' object.
    # This block is only for local development.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
