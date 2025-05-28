import cv2
import os

# Imports for PySceneDetect
from scenedetect import open_video, SceneManager, FrameTimecode # Ensure FrameTimecode is imported
from scenedetect.detectors import ContentDetector

def extract_frames(video_path, output_folder, 
                   interval_seconds=None, interval_frames=None, output_format="jpg",
                   start_time_sec=None, end_time_sec=None):
    """
    Extracts frames from a video file based on time or frame intervals within a specified time segment.

    Args:
        video_path (str): Path to the video file.
        output_folder (str): Path to the folder where extracted frames will be saved.
        interval_seconds (float, optional): Interval in seconds.
        interval_frames (int, optional): Interval in frames.
        output_format (str, optional): Output image format. Defaults to "jpg".
        start_time_sec (float, optional): Start time in seconds to begin extraction.
        end_time_sec (float, optional): End time in seconds to stop extraction.

    Returns:
        tuple: (bool, list) - Success status and list of extracted frame metadata.
    """
    extracted_frame_info = []
    video_filename = os.path.basename(video_path)

    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}"); return False, extracted_frame_info
    if interval_seconds is None and interval_frames is None:
        print("Error: Either interval_seconds or interval_frames must be specified."); return False, extracted_frame_info
    if interval_seconds is not None and interval_frames is not None:
        print("Warning: Both interval_seconds/frames specified; interval_seconds used."); interval_frames = None
    if not output_format.lower() in ["jpg", "jpeg", "png"]:
        print(f"Error: Unsupported output format '{output_format}'."); return False, extracted_frame_info
    if not os.path.exists(output_folder):
        try: os.makedirs(output_folder)
        except OSError as e: print(f"Error creating output folder {output_folder}: {e}"); return False, extracted_frame_info

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path} with OpenCV."); return False, extracted_frame_info

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration_sec = total_video_frames / fps if fps > 0 else 0

    if fps == 0:
        print("Warning: Video FPS is 0. Cannot reliably perform time-based operations."); cap.release(); return False, extracted_frame_info

    # Validate start_time_sec and end_time_sec against video duration
    if start_time_sec is not None:
        if start_time_sec >= video_duration_sec:
            print(f"Error: Start time ({start_time_sec:.2f}s) is beyond video duration ({video_duration_sec:.2f}s)."); cap.release(); return False, extracted_frame_info
        # Seek video to start_time_sec
        cap.set(cv2.CAP_PROP_POS_MSEC, start_time_sec * 1000)
        print(f"  Processing from {start_time_sec:.2f}s.")
    
    if end_time_sec is not None and end_time_sec <= (start_time_sec or 0): # Ensure end_time is after start_time
        print(f"Error: End time ({end_time_sec:.2f}s) must be after start time ({(start_time_sec or 0):.2f}s)."); cap.release(); return False, extracted_frame_info
    
    effective_start_time_sec = start_time_sec or 0
    # If end_time_sec is None, process till the end of the video.

    print(f"Video Properties: FPS={fps:.2f}, Total Frames={total_video_frames}, Duration={video_duration_sec:.2f}s")
    if start_time_sec is not None or end_time_sec is not None:
        print(f"  Processing segment: Start={effective_start_time_sec:.2f}s, End={(end_time_sec if end_time_sec is not None else video_duration_sec):.2f}s")


    saved_frame_count = 0
    # Adjust next_extraction_time_sec if start_time_sec is provided.
    # The first frame to consider is at or after start_time_sec.
    next_extraction_time_sec = effective_start_time_sec 
    
    # For frame-based interval, we need to count frames from the effective start.
    frames_processed_in_segment = 0 

    while True:
        # Read frame before checking time to ensure cap.get(cv2.CAP_PROP_POS_MSEC) is up-to-date
        ret, frame = cap.read() 
        current_timestamp_msec = cap.get(cv2.CAP_PROP_POS_MSEC) # Get current timestamp *after* read
        current_timestamp_sec = current_timestamp_msec / 1000.0

        if not ret: # End of video or read error
            break 
        
        # Stop if current_timestamp_sec exceeds end_time_sec (if specified)
        if end_time_sec is not None and current_timestamp_sec > end_time_sec:
            print(f"  Reached end time ({end_time_sec:.2f}s). Stopping extraction.")
            break
        
        # Determine current frame number relative to video start (for metadata)
        # CAP_PROP_POS_FRAMES can be unreliable; calculate from timestamp if possible.
        current_frame_num_abs = int(current_timestamp_sec * fps) if fps > 0 else int(cap.get(cv2.CAP_PROP_POS_FRAMES))

        process_this_frame = False
        if interval_seconds is not None:
            if current_timestamp_sec >= next_extraction_time_sec:
                process_this_frame = True
                while current_timestamp_sec >= next_extraction_time_sec : # Ensure next extraction time is in the future
                    next_extraction_time_sec += interval_seconds
        elif interval_frames is not None:
            # For interval_frames, ensure we are past start_time_sec if specified
            if current_timestamp_sec >= effective_start_time_sec:
                if frames_processed_in_segment % interval_frames == 0:
                    process_this_frame = True
        
        if process_this_frame:
            output_filename = f"frame_{saved_frame_count:05d}_absFN{current_frame_num_abs}.{output_format.lower()}"
            output_path = os.path.join(output_folder, output_filename)
            try:
                cv2.imwrite(output_path, frame)
                extracted_frame_info.append({
                    'frame_path': output_path,
                    'frame_number': current_frame_num_abs, # Absolute frame number
                    'timestamp_sec': round(current_timestamp_sec, 3),
                    'video_filename': video_filename
                })
                print(f"Saved frame {saved_frame_count+1} (AbsFrame: {current_frame_num_abs}, Time: {current_timestamp_sec:.2f}s) as {output_path}")
                saved_frame_count += 1
            except Exception as e:
                print(f"Error saving frame {current_frame_num_abs} to {output_path}: {e}")
        
        if current_timestamp_sec >= effective_start_time_sec: # Only count frames within the desired segment
            frames_processed_in_segment += 1


    cap.release()
    print(f"\nInterval-based extraction complete. Saved {saved_frame_count} frames.")
    return True, extracted_frame_info


def extract_shot_boundary_frames(video_path, output_folder, output_format="jpg", 
                                 detector_threshold=27.0, start_time_sec=None, end_time_sec=None):
    """
    Detects shot boundaries within a specified time segment and extracts metadata.
    """
    shot_meta_list = []
    video_filename = os.path.basename(video_path)

    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}"); return False, shot_meta_list
    if not output_format.lower() in ["jpg", "jpeg", "png"]:
        print(f"Error: Unsupported output format '{output_format}'."); return False, shot_meta_list
    if not os.path.exists(output_folder):
        try: os.makedirs(output_folder)
        except OSError as e: print(f"Error creating output folder {output_folder}: {e}"); return False, shot_meta_list

    video_manager = None
    cap_cv = None
    try:
        video_manager = open_video(video_path)
        if not video_manager:
             print(f"Error: PySceneDetect could not open/analyze video: {video_path}"); return False, shot_meta_list

        # Set duration for scene detection if start/end times are provided
        video_fps = video_manager.frame_rate
        video_duration_sec = video_manager.duration.get_seconds()

        # Validate start/end times against video duration
        effective_start_time = None
        effective_end_time = None

        if start_time_sec is not None:
            if start_time_sec >= video_duration_sec:
                print(f"Error: Start time ({start_time_sec:.2f}s) is beyond video duration ({video_duration_sec:.2f}s).")
                return False, shot_meta_list
            effective_start_time = FrameTimecode(timecode=start_time_sec, fps=video_fps)
            print(f"  Shot detection from {start_time_sec:.2f}s ({effective_start_time.get_timecode()}).")

        if end_time_sec is not None:
            if end_time_sec <= (start_time_sec or 0):
                print(f"Error: End time ({end_time_sec:.2f}s) must be after start time ({(start_time_sec or 0):.2f}s).")
                return False, shot_meta_list
            if end_time_sec > video_duration_sec:
                print(f"  Warning: End time ({end_time_sec:.2f}s) exceeds video duration ({video_duration_sec:.2f}s). Clamping to video end.")
                end_time_sec = video_duration_sec
            effective_end_time = FrameTimecode(timecode=end_time_sec, fps=video_fps)
            print(f"  Shot detection until {end_time_sec:.2f}s ({effective_end_time.get_timecode()}).")

        # PySceneDetect's detect_scenes can take start_time and end_time directly.
        scene_manager = SceneManager()
        scene_manager.add_detector(ContentDetector(threshold=detector_threshold))
        
        print(f"Starting shot detection for '{video_path}' (Threshold: {detector_threshold})...")
        scene_manager.detect_scenes(
            video=video_manager, 
            start_time=effective_start_time, 
            end_time=effective_end_time,
            show_progress=True
        )
        scene_list = scene_manager.get_scene_list()

        if not scene_list:
            print("No shots detected in the specified segment."); return True, shot_meta_list

        print(f"Detected {len(scene_list)} shots within the segment.")

        cap_cv = cv2.VideoCapture(video_path)
        if not cap_cv.isOpened():
            print(f"Error: OpenCV could not open video {video_path} for frame extraction."); return False, shot_meta_list

        saved_frame_count = 0
        for i, (start_tc, end_tc) in enumerate(scene_list): # start_tc, end_tc are FrameTimecode objects
            start_frame_abs = start_tc.get_frames() # Absolute frame number
            end_frame_abs = end_tc.get_frames()     # Absolute frame number (exclusive for ContentDetector)
            duration_frames = end_frame_abs - start_frame_abs
            actual_end_frame_inclusive_abs = end_frame_abs - 1

            if duration_frames <= 0: continue

            cap_cv.set(cv2.CAP_PROP_POS_FRAMES, start_frame_abs)
            ret, frame_image = cap_cv.read()

            if ret:
                output_filename = f"shot_{i+1:04d}_absFN{start_frame_abs}.{output_format.lower()}"
                output_path = os.path.join(output_folder, output_filename)
                try:
                    cv2.imwrite(output_path, frame_image)
                    shot_meta_list.append({
                        'frame_path': output_path,
                        'video_filename': video_filename,
                        'start_frame': start_frame_abs, # Absolute frame number
                        'end_frame': actual_end_frame_inclusive_abs, # Absolute inclusive end frame
                        'duration_frames': duration_frames,
                        'timestamp_sec': round(start_tc.get_seconds(), 3), # Absolute timestamp
                        'timecode': start_tc.get_timecode() # Absolute timecode
                    })
                    print(f"Saved frame for shot {i+1} (AbsFrame: {start_frame_abs}, Time: {start_tc.get_timecode()}) as {output_path}")
                    saved_frame_count += 1
                except Exception as e: print(f"Error saving frame {start_frame_abs} for shot {i+1}: {e}")
            else: print(f"Warning: Could not read frame {start_frame_abs} for shot {i+1}.")
        
        print(f"\nShot boundary frame extraction complete. Saved {saved_frame_count} frames.")
        return True, shot_meta_list

    except Exception as e:
        print(f"An error occurred during shot detection/extraction: {e}"); return False, shot_meta_list
    finally:
        if cap_cv: cap_cv.release()
        # video_manager is closed by PySceneDetect automatically or by its context manager if used.

if __name__ == "__main__":
    # (The __main__ block for testing can be kept similar, but now you can add
    #  start_time_sec and end_time_sec to calls to test the segmentation)
    print("Starting video frame extraction process demonstrations...")
    test_video_path = "sample_video.mp4"
    # ... (dummy video creation if not exists) ...
    if not os.path.exists(test_video_path):
        # Simplified dummy video creation for brevity
        print(f"Creating dummy video: {test_video_path}")
        cap_out = cv2.VideoWriter(test_video_path, cv2.VideoWriter_fourcc(*'mp4v'), 30, (640, 480))
        for i in range(210): # 7 seconds at 30fps
            frame = cv2.UMat(480, 640, cv2.CV_8UC3); frame.setTo([(i*2)%255, (i*3)%255, (i*4)%255])
            cap_out.write(frame)
        cap_out.release()


    if os.path.exists(test_video_path):
        output_dir_interval_seg = "extracted_frames_interval_segment"
        output_dir_shot_seg = "extracted_frames_shot_segment"
        for d in [output_dir_interval_seg, output_dir_shot_seg]:
            if os.path.exists(d): shutil.rmtree(d); os.makedirs(d)
            else: os.makedirs(d)

        print(f"\n--- Example: Interval extraction (every 1s) from segment [2s - 5s] of '{test_video_path}' ---")
        success_interval, data_interval = extract_frames(
            test_video_path, output_dir_interval_seg, interval_seconds=1.0, 
            start_time_sec=2.0, end_time_sec=5.0
        )
        if success_interval: print(f"  Extracted {len(data_interval)} frames. First: {data_interval[0] if data_interval else 'N/A'}")

        print(f"\n--- Example: Shot boundary extraction from segment [1s - 6s] of '{test_video_path}' ---")
        success_shot, data_shot = extract_shot_boundary_frames(
            test_video_path, output_dir_shot_seg, detector_threshold=20.0,
            start_time_sec=1.0, end_time_sec=6.0
        )
        if success_shot: print(f"  Detected {len(data_shot)} shots. First: {data_shot[0] if data_shot else 'N/A'}")
    else:
        print(f"\nSkipping example usage: dummy video '{test_video_path}' not found.")
    print("\nVideo frame extraction script demonstrations finished.")
```
