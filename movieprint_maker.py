import argparse
import os
import shutil
import tempfile
import glob
import json 
import re 
import cv2 

try:
    import video_processing
    import image_grid 
except ImportError as e:
    # This initial print is fine for CLI startup or module import errors
    print(f"Error importing modules: {e}")
    print("Please ensure 'video_processing.py' and 'image_grid.py' are in the same directory"
          " or accessible in the Python path.")
    exit(1)

def parse_time_to_seconds(time_str):
    if time_str is None: return None
    time_str = str(time_str).strip()
    try:
        seconds = float(time_str)
        return seconds if seconds >= 0 else None
    except ValueError: pass
    match = re.fullmatch(r'(?:(\d+):)?([0-5]?\d):([0-5]?\d(?:\.\d+)?)', time_str)
    if match:
        parts = match.groups()
        h = int(parts[0]) if parts[0] else 0
        m = int(parts[1]); s = float(parts[2])
        if m >= 60 or s >= 60: return None
        return float(h * 3600 + m * 60 + s)
    return None

def discover_video_files(input_sources, valid_extensions_str, recursive_scan, log_callback=print):
    video_files_found = set()
    valid_extensions = [ext.strip().lower() for ext in valid_extensions_str.split(',')]
    for source_path in input_sources:
        abs_source_path = os.path.abspath(source_path)
        if not os.path.exists(abs_source_path):
            log_callback(f"Warning: Input path not found: {abs_source_path}. Skipping.")
            continue
        if os.path.isfile(abs_source_path):
            _, file_ext = os.path.splitext(abs_source_path)
            if file_ext.lower() in valid_extensions: video_files_found.add(abs_source_path)
            else: log_callback(f"Warning: File '{abs_source_path}' lacks recognized video extension. Skipping.")
        elif os.path.isdir(abs_source_path):
            log_callback(f"Scanning directory: {abs_source_path}{' (recursively)' if recursive_scan else ''}...")
            scan_pattern = os.path.join(abs_source_path, "**", "*") if recursive_scan else os.path.join(abs_source_path, "*")
            for item_path in glob.glob(scan_pattern, recursive=recursive_scan):
                if os.path.isfile(item_path):
                    _, file_ext = os.path.splitext(item_path)
                    if file_ext.lower() in valid_extensions: video_files_found.add(item_path)
        else: log_callback(f"Warning: Input path '{abs_source_path}' not a file/directory. Skipping.")
    return sorted(list(video_files_found))


def process_single_video(video_file_path, settings, effective_output_filename, log_callback=print):
    log_callback(f"\nProcessing video: {video_file_path}...")

    start_time_sec = parse_time_to_seconds(settings.start_time)
    end_time_sec = parse_time_to_seconds(settings.end_time)

    if settings.start_time is not None and start_time_sec is None:
        return False, f"Invalid --start_time format: '{settings.start_time}'."
    if settings.end_time is not None and end_time_sec is None:
        return False, f"Invalid --end_time format: '{settings.end_time}'."
    if start_time_sec is not None and end_time_sec is not None and start_time_sec >= end_time_sec:
        return False, f"Error: --start_time must be less than --end_time."
    
    temp_frames_output_folder = settings.temp_dir
    cleanup_temp_dir_for_this_video = False
    if temp_frames_output_folder:
        video_basename = os.path.splitext(os.path.basename(video_file_path))[0]
        temp_frames_output_folder = os.path.join(temp_frames_output_folder, f"movieprint_temp_{video_basename}")
        if not os.path.exists(temp_frames_output_folder):
            try: os.makedirs(temp_frames_output_folder)
            except OSError as e: return False, f"Error creating temp sub-dir {temp_frames_output_folder}: {e}"
    else:
        temp_frames_output_folder = tempfile.mkdtemp(prefix=f"movieprint_{os.path.splitext(os.path.basename(video_file_path))[0]}_")
        cleanup_temp_dir_for_this_video = True
    log_callback(f"  Using temporary directory for frames: {temp_frames_output_folder}")

    extraction_ok = False
    source_frame_metadata_list = [] 
    
    if settings.extraction_mode == "interval":
        extraction_ok, source_frame_metadata_list = video_processing.extract_frames(
            video_path=video_file_path, output_folder=temp_frames_output_folder,
            interval_seconds=settings.interval_seconds, interval_frames=settings.interval_frames,
            output_format=settings.frame_format,
            start_time_sec=start_time_sec, end_time_sec=end_time_sec
        )
    elif settings.extraction_mode == "shot":
        extraction_ok, source_frame_metadata_list = video_processing.extract_shot_boundary_frames(
            video_path=video_file_path, output_folder=temp_frames_output_folder,
            output_format=settings.frame_format, detector_threshold=settings.shot_threshold,
            start_time_sec=start_time_sec, end_time_sec=end_time_sec
        )

    if not extraction_ok: 
        message = f"Frame extraction failed for {video_file_path}."
        if cleanup_temp_dir_for_this_video and os.path.exists(temp_frames_output_folder):
            try: shutil.rmtree(temp_frames_output_folder); message += " Temp dir cleaned."
            except Exception as e: message += f" Error cleaning temp dir: {e}"
        return False, message

    initial_thumb_count = len(source_frame_metadata_list)
    excluded_items_info_for_log = [] 

    if settings.extraction_mode == 'interval' and settings.exclude_frames:
        frames_to_exclude_set = set(settings.exclude_frames)
        original_frame_numbers = {item['frame_number'] for item in source_frame_metadata_list}
        not_found_exclusions = frames_to_exclude_set - original_frame_numbers
        if not_found_exclusions:
            msg = f"  Warning: Requested frames to exclude not found: {sorted(list(not_found_exclusions))}"
            log_callback(msg); excluded_items_info_for_log.append(msg)
        source_frame_metadata_list = [item for item in source_frame_metadata_list if item['frame_number'] not in frames_to_exclude_set]
        if len(source_frame_metadata_list) < initial_thumb_count:
             excluded_items_info_for_log.extend([f"excluded_frame_num:{fn}" for fn in frames_to_exclude_set if fn in original_frame_numbers])
    elif settings.extraction_mode == 'shot' and settings.exclude_shots:
        shots_to_exclude_0_based_set = {idx - 1 for idx in settings.exclude_shots}
        valid_indices_to_exclude = []
        temp_filtered_list = []
        for i, item in enumerate(source_frame_metadata_list):
            if i not in shots_to_exclude_0_based_set: temp_filtered_list.append(item)
            else: valid_indices_to_exclude.append(i + 1)
        source_frame_metadata_list = temp_filtered_list
        for requested_idx_1_based in settings.exclude_shots:
            if requested_idx_1_based -1 >= initial_thumb_count or requested_idx_1_based <=0 :
                msg = f"  Warning: Shot index {requested_idx_1_based} out of range (1-{initial_thumb_count})."
                log_callback(msg); excluded_items_info_for_log.append(msg)
            elif requested_idx_1_based in valid_indices_to_exclude:
                 excluded_items_info_for_log.append(f"excluded_shot_idx:{requested_idx_1_based}")

    if initial_thumb_count > 0 and len(source_frame_metadata_list) < initial_thumb_count:
        log_callback(f"  Applied exclusions: {initial_thumb_count - len(source_frame_metadata_list)} thumbnails removed.")

    face_cascade = None
    if settings.detect_faces:
        haar_cascade_path = settings.haar_cascade_xml if settings.haar_cascade_xml else os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        if not os.path.exists(haar_cascade_path):
            msg = f"  Warning: Haar Cascade XML not found at '{haar_cascade_path}'. Face detection skipped."
            log_callback(msg); excluded_items_info_for_log.append(msg) 
        else:
            face_cascade = cv2.CascadeClassifier(haar_cascade_path)
            if face_cascade.empty():
                msg = f"  Warning: Failed to load Haar Cascade XML from '{haar_cascade_path}'. Face detection skipped."
                log_callback(msg); excluded_items_info_for_log.append(msg); face_cascade = None
            else: log_callback(f"  Face detection enabled using: {haar_cascade_path}")

    if face_cascade:
        log_callback("  Performing face detection on thumbnails...")
        for item_meta in source_frame_metadata_list:
            try:
                frame_image = cv2.imread(item_meta['frame_path'])
                if frame_image is None: log_callback(f"    Warning: Could not read {item_meta['frame_path']} for face detection."); continue
                gray_image = cv2.cvtColor(frame_image, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=4, minSize=(20, 20))
                item_meta['face_detection'] = {'num_faces': len(faces), 'face_bboxes_thumbnail': [list(f) for f in faces]}
                if len(faces) > 0: log_callback(f"    Detected {len(faces)} face(s) in thumbnail from frame {item_meta.get('frame_number', item_meta.get('start_frame', 'N/A'))}")
            except Exception as e: log_callback(f"    Error during face detection for {item_meta['frame_path']}: {e}"); item_meta['face_detection'] = {'error': str(e)}

    if settings.rotate_thumbnails != 0:
        log_callback(f"  Rotating thumbnails by {settings.rotate_thumbnails} degrees clockwise...")
        rotation_flag = None
        if settings.rotate_thumbnails == 90: rotation_flag = cv2.ROTATE_90_CLOCKWISE
        elif settings.rotate_thumbnails == 180: rotation_flag = cv2.ROTATE_180
        elif settings.rotate_thumbnails == 270: rotation_flag = cv2.ROTATE_90_COUNTERCLOCKWISE
        
        if rotation_flag is not None:
            for i, item_meta in enumerate(source_frame_metadata_list):
                try:
                    thumb_img = cv2.imread(item_meta['frame_path'])
                    if thumb_img is None: log_callback(f"    Warning: Could not read image {item_meta['frame_path']} for rotation. Skipping."); continue
                    rotated_img = cv2.rotate(thumb_img, rotation_flag)
                    if not cv2.imwrite(item_meta['frame_path'], rotated_img): log_callback(f"    Warning: Failed to save rotated image {item_meta['frame_path']}. Skipping rotation.")
                except Exception as e: log_callback(f"    Error during rotation for {item_meta['frame_path']}: {e}. Skipping rotation."); item_meta['rotation_error'] = str(e)
        else: log_callback(f"  Warning: Invalid rotation angle {settings.rotate_thumbnails}. Skipping rotation.")

    items_for_grid_input = []
    if settings.layout_mode == "timeline": 
        items_for_grid_input = [{'image_path': sm['frame_path'], 'width_ratio': float(sm['duration_frames'])}
                                for sm in source_frame_metadata_list if sm.get('duration_frames', 0) > 0]
        if not items_for_grid_input and source_frame_metadata_list:
             log_callback("  Warning: No shots with positive duration remain for timeline view.")
    else: 
         items_for_grid_input = [meta['frame_path'] for meta in source_frame_metadata_list]

    if not items_for_grid_input: 
        message = f"No frames/shots remaining after all processing for {video_file_path}."
        if cleanup_temp_dir_for_this_video and os.path.exists(temp_frames_output_folder):
            try: shutil.rmtree(temp_frames_output_folder); message += " Temp dir cleaned."
            except Exception as e: message += f" Error cleaning temp dir: {e}"
        return False, message
    
    log_callback(f"  Proceeding with {len(items_for_grid_input)} items for grid generation.")

    if not os.path.exists(settings.output_dir):
        try: os.makedirs(settings.output_dir)
        except OSError as e: return False, f"Error creating output directory {settings.output_dir}: {e}"

    final_movieprint_path = os.path.join(settings.output_dir, effective_output_filename)
    counter = 1; base, ext = os.path.splitext(final_movieprint_path)
    while os.path.exists(final_movieprint_path):
        final_movieprint_path = f"{base}_{counter}{ext}"; counter+=1
    if counter > 1: log_callback(f"  Warning: Movieprint file existed. Saving as {final_movieprint_path}")
    
    log_callback(f"  Generating MoviePrint ({settings.layout_mode} layout) -> {final_movieprint_path}")
    
    grid_params = { 'image_source_data': items_for_grid_input, 'output_path': final_movieprint_path,
        'padding': settings.padding, 'background_color_hex': settings.background_color, 'layout_mode': settings.layout_mode }
    if settings.layout_mode == "grid": grid_params['columns'] = settings.columns
    elif settings.layout_mode == "timeline":
        grid_params['target_row_height'] = settings.target_row_height
        grid_params['max_grid_width'] = settings.output_image_width

    grid_success, thumbnail_layout_data = image_grid.create_image_grid(**grid_params)

    if not grid_success:
        if cleanup_temp_dir_for_this_video and os.path.exists(temp_frames_output_folder):
            try: shutil.rmtree(temp_frames_output_folder)
            except Exception as e: log_callback(f"  Error cleaning temp dir after failed grid: {e}")
        return False, f"MoviePrint image generation failed for {video_file_path}."
    
    log_callback(f"  MoviePrint successfully saved to {final_movieprint_path}")

    if settings.save_metadata_json:
        log_callback(f"  Generating metadata JSON...")
        source_metadata_map = {meta['frame_path']: meta for meta in source_frame_metadata_list}
        combined_thumbnails_metadata = []
        for layout_item in thumbnail_layout_data: 
            source_meta = source_metadata_map.get(layout_item['image_path'])
            if source_meta: 
                final_thumb_meta = {
                    'original_video_filename': source_meta.get('video_filename'),
                    'source_frame_number': source_meta.get('frame_number'),
                    'source_timestamp_sec': source_meta.get('timestamp_sec'),
                    'source_timecode': source_meta.get('timecode'),
                    'shot_start_frame': source_meta.get('start_frame'),
                    'shot_end_frame': source_meta.get('end_frame'),
                    'shot_duration_frames': source_meta.get('duration_frames'),
                    'layout_in_movieprint': { 'x': layout_item['x'], 'y': layout_item['y'],
                        'width': layout_item['width'], 'height': layout_item['height'] },
                    'face_detection': source_meta.get('face_detection'),
                    'rotation_error': source_meta.get('rotation_error') 
                }
                final_thumb_meta_cleaned = {k: v for k, v in final_thumb_meta.items() if v is not None}
                combined_thumbnails_metadata.append(final_thumb_meta_cleaned)
        
        settings_dict_copy = vars(settings).copy() # Use 'settings' now
        settings_dict_copy['parsed_start_time_sec'] = start_time_sec
        settings_dict_copy['parsed_end_time_sec'] = end_time_sec
        if excluded_items_info_for_log : settings_dict_copy['processing_warnings_log'] = excluded_items_info_for_log

        full_metadata = {
            'movieprint_image_filename': os.path.basename(final_movieprint_path),
            'source_video_processed': video_file_path,
            'generation_parameters': settings_dict_copy,
            'thumbnails': combined_thumbnails_metadata
        }
        json_output_path = os.path.splitext(final_movieprint_path)[0] + ".json"
        try:
            with open(json_output_path, 'w') as f: json.dump(full_metadata, f, indent=4)
            log_callback(f"  Metadata JSON saved to {json_output_path}")
        except Exception as e: log_callback(f"  Error saving metadata JSON to {json_output_path}: {e}")

    if cleanup_temp_dir_for_this_video:
        try:
            shutil.rmtree(temp_frames_output_folder)
            log_callback(f"  Successfully cleaned up temporary frames directory: {temp_frames_output_folder}")
        except Exception as e: log_callback(f"  Error during cleanup of temporary directory {temp_frames_output_folder}: {e}")
    return True, final_movieprint_path

def execute_movieprint_generation(settings, log_callback=print, progress_callback=None):
    """
    Core logic for generating MoviePrints based on provided settings.
    Designed to be callable from CLI or GUI.
    """
    log_callback("Starting MoviePrint generation process...")

    video_files_to_process = discover_video_files(
        settings.input_paths, 
        settings.video_extensions, 
        settings.recursive_scan,
        log_callback=log_callback # Pass log_callback here
    )

    if not video_files_to_process:
        log_callback("No video files found to process. Please check your input paths and video extensions.")
        return [], [] # Return empty lists for successful and failed operations

    log_callback(f"\nFound {len(video_files_to_process)} video file(s) to process.")

    successful_ops = []
    failed_ops = []
    
    is_single_file_direct_input = len(settings.input_paths) == 1 and os.path.isfile(settings.input_paths[0])
    
    output_print_format = "png" 
    if is_single_file_direct_input and settings.output_filename:
        _, ext = os.path.splitext(settings.output_filename)
        if ext.lower() in ['.png', '.jpg', '.jpeg']: 
            output_print_format = ext.lower().replace('.', '').replace('jpeg','jpg')
        elif settings.frame_format.lower() in ['jpg', 'png']: 
            output_print_format = settings.frame_format.lower()

    total_videos = len(video_files_to_process)
    for i, video_path in enumerate(video_files_to_process):
        if progress_callback:
            progress_callback(i, total_videos, video_path) # Current index, total, current file

        effective_output_name = ""
        if is_single_file_direct_input and settings.output_filename:
            effective_output_name = settings.output_filename
        else:
            base = os.path.splitext(os.path.basename(video_path))[0]
            effective_output_name = f"{base}{settings.output_filename_suffix}.{output_print_format}"
        
        try:
            success, message_or_path = process_single_video(video_path, settings, effective_output_name, log_callback=log_callback)
            if success: 
                successful_ops.append({'video': video_path, 'output': message_or_path})
            else: 
                failed_ops.append({'video': video_path, 'reason': message_or_path})
        except Exception as e:
            log_callback(f"CRITICAL UNHANDLED ERROR processing {video_path}: {e}")
            failed_ops.append({'video': video_path, 'reason': f"Unexpected critical error: {str(e)}"})
    
    if progress_callback: # Final progress update
        progress_callback(total_videos, total_videos, "Batch completed")

    return successful_ops, failed_ops


def main():
    parser = argparse.ArgumentParser(
        description="Create MoviePrints from video files or directories.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    # (Argument definitions remain exactly the same as the previous version)
    parser.add_argument("input_paths", nargs='+', help="Video files or directories.")
    parser.add_argument("output_dir", help="Directory for final MoviePrint image(s).")
    parser.add_argument("--output_filename_suffix", type=str, default="_movieprint", help="Suffix for auto-generated filenames (default: _movieprint).")
    parser.add_argument("--output_filename", type=str, default=None, help="Specific output filename (only if single input file).")

    batch_group = parser.add_argument_group("Batch Processing Options")
    batch_group.add_argument("--video_extensions", type=str, default=".mp4,.avi,.mov,.mkv,.flv,.wmv", help="Comma-separated video extensions (default: .mp4,...).")
    batch_group.add_argument("--recursive_scan", action="store_true", help="Scan directories recursively.")

    time_segment_group = parser.add_argument_group("Time Segment Options")
    time_segment_group.add_argument("--start_time", type=str, default=None, help="Start time for processing (HH:MM:SS, MM:SS, or seconds).")
    time_segment_group.add_argument("--end_time", type=str, default=None, help="End time for processing (HH:MM:SS, MM:SS, or seconds).")

    extraction_group = parser.add_argument_group("Frame Extraction Options")
    extraction_group.add_argument("--extraction_mode", type=str, default="interval", choices=["interval", "shot"], help="Frame extraction mode (default: interval).")
    extraction_group.add_argument("--interval_seconds", type=float, help="For 'interval' mode: interval in seconds.")
    extraction_group.add_argument("--interval_frames", type=int, help="For 'interval' mode: interval in frames.")
    extraction_group.add_argument("--shot_threshold", type=float, default=27.0, help="For 'shot' mode: detection threshold (default: 27.0).")
    extraction_group.add_argument("--exclude_frames", type=int, nargs='+', default=None, help="List of absolute frame numbers to exclude (for interval mode).")
    extraction_group.add_argument("--exclude_shots", type=int, nargs='+', default=None, help="List of 1-based shot indices to exclude (for shot mode).")

    layout_group = parser.add_argument_group("Layout Options")
    layout_group.add_argument("--layout_mode", type=str, default="grid", choices=["grid", "timeline"], help="Layout mode (default: grid).")
    layout_group.add_argument("--columns", type=int, default=5, help="For 'grid' layout: number of columns (default: 5).")
    layout_group.add_argument("--target_row_height", type=int, default=100, help="For 'timeline' layout: row height (default: 100).")
    layout_group.add_argument("--output_image_width", type=int, default=1200, help="For 'timeline' layout: output image width (default: 1200).")

    common_group = parser.add_argument_group("Common Styling, File & Metadata Options")
    common_group.add_argument("--padding", type=int, default=5, help="Padding between images (default: 5).")
    common_group.add_argument("--background_color", type=str, default="#FFFFFF", help="Background color (hex, default: #FFFFFF).")
    common_group.add_argument("--frame_format", type=str, default="jpg", choices=["jpg", "png"], help="Format for extracted frames (default: jpg).")
    common_group.add_argument("--temp_dir", type=str, default=None, help="Optional global temporary directory. Not auto-cleaned.")
    common_group.add_argument("--save_metadata_json", action="store_true", help="Save a JSON sidecar file with detailed metadata.")
    common_group.add_argument("--detect_faces", action="store_true", help="Enable face detection on thumbnails. Performance intensive.")
    common_group.add_argument("--haar_cascade_xml", type=str, default=None, 
                              help="Path to Haar Cascade XML file for face detection. \n"
                                   "If not provided, uses OpenCV's default 'haarcascade_frontalface_default.xml'.")
    common_group.add_argument("--rotate_thumbnails", type=int, default=0, choices=[0, 90, 180, 270],
                              help="Rotate all thumbnails by 0, 90, 180, or 270 degrees clockwise (default: 0).")

    args = parser.parse_args()
    
    # CLI specific callbacks
    def cli_log_callback(message):
        print(message)

    def cli_progress_callback(current, total, filename=""):
        if total > 0 :
             percent = (current / total) * 100
             status_msg = f"Processing file {current}/{total} ({percent:.1f}%): {os.path.basename(filename)}" if current < total else f"Batch completed {current}/{total}."
             print(status_msg, end='\r' if current < total else '\n')


    # Validations (remain the same)
    if args.extraction_mode == "interval":
        if args.interval_seconds is None and args.interval_frames is None:
            parser.error("For --extraction_mode 'interval', --interval_seconds or --interval_frames required.")
        if args.exclude_shots: parser.error("--exclude_shots only with --extraction_mode 'shot'.")
    elif args.extraction_mode == "shot":
        if args.exclude_frames: parser.error("--exclude_frames only with --extraction_mode 'interval'.")
    if args.layout_mode == "timeline" and args.extraction_mode != "shot": 
        parser.error("--layout_mode 'timeline' requires --extraction_mode 'shot'.")

    # Call the core logic function
    successful_ops, failed_ops = execute_movieprint_generation(
        settings=args, 
        log_callback=cli_log_callback,
        progress_callback=cli_progress_callback
    )

    # Print summary from the results of execute_movieprint_generation
    cli_log_callback("\n--- CLI Batch Processing Summary ---") # Use log_callback for consistency
    if successful_ops:
        cli_log_callback(f"\nSuccessfully processed {len(successful_ops)} video(s):")
        for item in successful_ops: cli_log_callback(f"  - Input: {item['video']}\n    Output: {item['output']}")
    else: cli_log_callback("No videos processed successfully.")
    
    if failed_ops:
        cli_log_callback(f"\nFailed to process {len(failed_ops)} video(s):")
        for item in failed_ops: cli_log_callback(f"  - Input: {item['video']}\n    Reason: {item['reason']}")
    elif successful_ops: cli_log_callback("\nAll identified videos processed without reported failures.")
    
    cli_log_callback("\nCLI movieprint creation process finished.")

if __name__ == "__main__":
    main()
```
