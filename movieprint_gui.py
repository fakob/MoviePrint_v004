import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext, messagebox
import os
import argparse # For creating Namespace object
import threading
import queue # For thread-safe communication

# Attempt to import the backend logic
try:
    from movieprint_maker import execute_movieprint_generation
except ImportError as e:
    messagebox.showerror("Import Error", 
                         f"Failed to import 'movieprint_maker'. Ensure it's in the Python path.\nError: {e}")
    exit()

class Tooltip:
    """
    Simple tooltip class for Tkinter widgets.
    """
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tooltip_window = None
        widget.bind("<Enter>", self.show_tooltip)
        widget.bind("<Leave>", self.hide_tooltip)

    def show_tooltip(self, event=None):
        x, y, _, _ = self.widget.bbox("insert") # Get coordinates relative to the widget
        # For entry, bbox("insert") might be None if empty. Use (0,0,0,0) as fallback.
        if x is None : x,y = 0,0

        x += self.widget.winfo_rootx() + self.widget.winfo_width() // 2 # Center on widget
        y += self.widget.winfo_rooty() + self.widget.winfo_height() + 5 # Below widget

        self.tooltip_window = tk.Toplevel(self.widget)
        self.tooltip_window.wm_overrideredirect(True) # No window decorations
        self.tooltip_window.wm_geometry(f"+{x}+{y}")

        label = tk.Label(self.tooltip_window, text=self.text, justify='left',
                         background="#ffffe0", relief='solid', borderwidth=1,
                         font=("tahoma", "8", "normal"), wraplength=300) # Wraplength for long tooltips
        label.pack(ipadx=2, ipady=2)

    def hide_tooltip(self, event=None):
        if self.tooltip_window:
            self.tooltip_window.destroy()
        self.tooltip_window = None


class MoviePrintApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("MoviePrint Generator")
        self.root.geometry("780x900") 

        # --- Variables to store user selections and defaults ---
        self.input_paths_var = tk.StringVar()
        self.output_dir_var = tk.StringVar()
        
        self.extraction_mode_var = tk.StringVar(value="interval")
        self.interval_seconds_var = tk.StringVar(value="5.0")
        self.interval_frames_var = tk.StringVar(value="") 
        self.shot_threshold_var = tk.StringVar(value="27.0")
        self.exclude_frames_var = tk.StringVar() 
        self.exclude_shots_var = tk.StringVar()  

        self.layout_mode_var = tk.StringVar(value="grid")
        self.num_columns_var = tk.StringVar(value="5")
        self.target_row_height_var = tk.StringVar(value="150")
        self.output_image_width_var = tk.StringVar(value="1920")

        self.padding_var = tk.StringVar(value="5")
        self.background_color_var = tk.StringVar(value="#FFFFFF")
        self.frame_format_var = tk.StringVar(value="jpg")
        self.save_metadata_json_var = tk.BooleanVar(value=True)
        self.detect_faces_var = tk.BooleanVar(value=False)
        self.rotate_thumbnails_var = tk.IntVar(value=0)
        
        self.start_time_var = tk.StringVar()
        self.end_time_var = tk.StringVar()

        self.output_filename_suffix_var = tk.StringVar(value="_movieprint")
        self.output_filename_var = tk.StringVar() 
        self.video_extensions_var = tk.StringVar(value=".mp4,.avi,.mov,.mkv,.flv,.wmv")
        self.recursive_scan_var = tk.BooleanVar(value=False)
        self.temp_dir_var = tk.StringVar() 
        self.haar_cascade_xml_var = tk.StringVar() 

        self.queue = queue.Queue()
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(expand=True, fill=tk.BOTH)

        self._create_input_output_section(main_frame)
        self._create_tabs_section(main_frame)
        self._create_action_log_section(main_frame)
        
        self.update_options_visibility() 
        self.root.after(100, self.check_queue)

    def _create_input_output_section(self, parent_frame):
        input_section = ttk.LabelFrame(parent_frame, text="Input / Output", padding="10")
        input_section.pack(fill=tk.X, padx=5, pady=5)
        input_section.columnconfigure(1, weight=1)

        lbl_input = ttk.Label(input_section, text="Video File(s) / Dir:")
        lbl_input.grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        Tooltip(lbl_input, "Select one or more video files, or a single directory containing videos.")
        self.input_paths_entry = ttk.Entry(input_section, textvariable=self.input_paths_var, state="readonly", width=60)
        self.input_paths_entry.grid(row=0, column=1, sticky=tk.EW, padx=5, pady=5)
        btn_browse_input = ttk.Button(input_section, text="Browse...", command=self.browse_input_paths)
        btn_browse_input.grid(row=0, column=2, padx=5, pady=5)
        Tooltip(btn_browse_input, "Browse for video files or a directory.")

        lbl_output_dir = ttk.Label(input_section, text="Output Directory:")
        lbl_output_dir.grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        Tooltip(lbl_output_dir, "Directory where MoviePrints will be saved.")
        self.output_dir_entry = ttk.Entry(input_section, textvariable=self.output_dir_var, state="readonly", width=60)
        self.output_dir_entry.grid(row=1, column=1, sticky=tk.EW, padx=5, pady=5)
        btn_browse_output = ttk.Button(input_section, text="Browse...", command=self.browse_output_dir)
        btn_browse_output.grid(row=1, column=2, padx=5, pady=5)
        Tooltip(btn_browse_output, "Browse for the output directory.")

    def _create_tabs_section(self, parent_frame):
        notebook = ttk.Notebook(parent_frame, padding="5")
        notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        tab_extraction = ttk.Frame(notebook, padding="5")
        tab_layout = ttk.Frame(notebook, padding="5")
        tab_batch_output = ttk.Frame(notebook, padding="5")
        tab_common = ttk.Frame(notebook, padding="5")
        
        notebook.add(tab_extraction, text='Extraction & Segment')
        notebook.add(tab_layout, text='Layout')
        notebook.add(tab_batch_output, text='Batch & Output')
        notebook.add(tab_common, text='Common & Advanced')

        self._populate_extraction_tab(tab_extraction)
        self._populate_layout_tab(tab_layout)
        self._populate_batch_output_tab(tab_batch_output)
        self._populate_common_tab(tab_common)

    def _populate_extraction_tab(self, tab):
        tab.columnconfigure(1, weight=1)
        
        lbl_ext_mode = ttk.Label(tab, text="Extraction Mode:")
        lbl_ext_mode.grid(row=0, column=0, sticky=tk.W, padx=5, pady=(5,2))
        self.extraction_mode_combo = ttk.Combobox(tab, textvariable=self.extraction_mode_var, 
                                                  values=["interval", "shot"], state="readonly", width=15)
        self.extraction_mode_combo.grid(row=0, column=1, sticky=tk.EW, padx=5, pady=(5,2))
        self.extraction_mode_combo.bind("<<ComboboxSelected>>", self.update_options_visibility)
        Tooltip(self.extraction_mode_combo, "Choose method: regular intervals or detected shots.")

        # Interval Options Frame (Dynamic)
        self.interval_options_frame = ttk.Frame(tab)
        self.interval_options_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=(0,2))
        self.interval_options_frame.columnconfigure(1, weight=1)
        
        lbl_int_sec = ttk.Label(self.interval_options_frame, text="Interval (seconds):")
        lbl_int_sec.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.interval_seconds_entry = ttk.Entry(self.interval_options_frame, textvariable=self.interval_seconds_var, width=10)
        self.interval_seconds_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.interval_seconds_entry, "Time between frames for 'interval' mode (e.g., 5.0).")

        lbl_int_frames = ttk.Label(self.interval_options_frame, text="Interval (frames):")
        lbl_int_frames.grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.interval_frames_entry = ttk.Entry(self.interval_options_frame, textvariable=self.interval_frames_var, width=10)
        self.interval_frames_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.interval_frames_entry, "Frame count between frames for 'interval' mode (e.g., 150).\nIf both seconds and frames interval are set, seconds interval is used.")

        # Shot Options Frame (Dynamic)
        self.shot_options_frame = ttk.Frame(tab) 
        self.shot_options_frame.grid(row=2, column=0, columnspan=2, sticky=tk.EW, pady=(0,2))
        self.shot_options_frame.columnconfigure(1, weight=1)
        lbl_shot_thresh = ttk.Label(self.shot_options_frame, text="Shot Threshold:")
        lbl_shot_thresh.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.shot_threshold_entry = ttk.Entry(self.shot_options_frame, textvariable=self.shot_threshold_var, width=10)
        self.shot_threshold_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.shot_threshold_entry, "Sensitivity for shot detection (e.g., 27.0). Lower = more shots.")

        # Time Segment Options
        lbl_start_time = ttk.Label(tab, text="Start Time (HH:MM:SS or S):")
        lbl_start_time.grid(row=3, column=0, sticky=tk.W, padx=5, pady=(5,2))
        self.start_time_entry = ttk.Entry(tab, textvariable=self.start_time_var, width=15)
        self.start_time_entry.grid(row=3, column=1, sticky=tk.W, padx=5, pady=(5,2))
        Tooltip(self.start_time_entry, "Process video from this time. Examples: '01:23:45', '90:00', '5400.5'.\nLeave blank to process from the beginning.")

        lbl_end_time = ttk.Label(tab, text="End Time (HH:MM:SS or S):")
        lbl_end_time.grid(row=4, column=0, sticky=tk.W, padx=5, pady=(2,5))
        self.end_time_entry = ttk.Entry(tab, textvariable=self.end_time_var, width=15)
        self.end_time_entry.grid(row=4, column=1, sticky=tk.W, padx=5, pady=(2,5))
        Tooltip(self.end_time_entry, "Process video up to this time. Examples: '01:23:45', '90:00', '5400.5'.\nLeave blank to process until the end.")

        # Exclusion Options
        lbl_ex_frames = ttk.Label(tab, text="Exclude Frames (abs nums):")
        lbl_ex_frames.grid(row=5, column=0, sticky=tk.W, padx=5, pady=(5,2))
        self.exclude_frames_entry = ttk.Entry(tab, textvariable=self.exclude_frames_var)
        self.exclude_frames_entry.grid(row=5, column=1, sticky=tk.EW, padx=5, pady=(5,2))
        Tooltip(self.exclude_frames_entry, "Comma-separated absolute frame numbers to exclude (for interval mode only). E.g., 100,101,150")

        lbl_ex_shots = ttk.Label(tab, text="Exclude Shots (1-based idx):")
        lbl_ex_shots.grid(row=6, column=0, sticky=tk.W, padx=5, pady=(2,5))
        self.exclude_shots_entry = ttk.Entry(tab, textvariable=self.exclude_shots_var)
        self.exclude_shots_entry.grid(row=6, column=1, sticky=tk.EW, padx=5, pady=(2,5))
        Tooltip(self.exclude_shots_entry, "Comma-separated 1-based shot indices to exclude (for shot mode only). E.g., 1,3")

    def _populate_layout_tab(self, tab):
        tab.columnconfigure(1, weight=1)
        lbl_layout_mode = ttk.Label(tab, text="Layout Mode:")
        lbl_layout_mode.grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.layout_mode_combo = ttk.Combobox(tab, textvariable=self.layout_mode_var,
                                              values=["grid", "timeline"], state="readonly", width=15)
        self.layout_mode_combo.grid(row=0, column=1, sticky=tk.EW, padx=5, pady=5)
        self.layout_mode_combo.bind("<<ComboboxSelected>>", self.update_options_visibility)
        Tooltip(self.layout_mode_combo, "Choose MoviePrint layout: fixed grid or timeline (proportional width).\nTimeline layout requires 'shot' extraction mode.")

        self.grid_options_frame = ttk.Frame(tab)
        self.grid_options_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=3)
        self.grid_options_frame.columnconfigure(1, weight=1)
        lbl_cols = ttk.Label(self.grid_options_frame, text="Number of Columns:")
        lbl_cols.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.num_columns_entry = ttk.Entry(self.grid_options_frame, textvariable=self.num_columns_var, width=10)
        self.num_columns_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.num_columns_entry, "Number of columns for 'grid' layout.")

        self.timeline_options_frame = ttk.Frame(tab)
        self.timeline_options_frame.grid(row=2, column=0, columnspan=2, sticky=tk.EW, pady=3)
        self.timeline_options_frame.columnconfigure(1, weight=1)
        lbl_row_h = ttk.Label(self.timeline_options_frame, text="Target Row Height (px):")
        lbl_row_h.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.target_row_height_entry = ttk.Entry(self.timeline_options_frame, textvariable=self.target_row_height_var, width=10)
        self.target_row_height_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.target_row_height_entry, "Target height for each row in 'timeline' layout.")
        lbl_out_w = ttk.Label(self.timeline_options_frame, text="Output Image Width (px):")
        lbl_out_w.grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.output_image_width_entry = ttk.Entry(self.timeline_options_frame, textvariable=self.output_image_width_var, width=10)
        self.output_image_width_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        Tooltip(self.output_image_width_entry, "Target width for the final image in 'timeline' layout.")

    def _populate_batch_output_tab(self, tab):
        tab.columnconfigure(1, weight=1)
        lbl_out_fname = ttk.Label(tab, text="Output Filename (single input):")
        lbl_out_fname.grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.output_filename_entry = ttk.Entry(tab, textvariable=self.output_filename_var, width=40)
        self.output_filename_entry.grid(row=0, column=1, sticky=tk.EW, padx=5, pady=5)
        Tooltip(self.output_filename_entry, "Specific filename if only one input file is processed.\nOtherwise, filenames are auto-generated using the suffix below.")

        lbl_out_suffix = ttk.Label(tab, text="Output Suffix (batch mode):")
        lbl_out_suffix.grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.output_filename_suffix_entry = ttk.Entry(tab, textvariable=self.output_filename_suffix_var, width=20)
        self.output_filename_suffix_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.output_filename_suffix_entry, "Suffix for auto-generated filenames in batch mode (e.g., '_movieprint').")

        lbl_vid_ext = ttk.Label(tab, text="Video Extensions (batch scan):")
        lbl_vid_ext.grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.video_extensions_entry = ttk.Entry(tab, textvariable=self.video_extensions_var, width=40)
        self.video_extensions_entry.grid(row=2, column=1, sticky=tk.EW, padx=5, pady=5)
        Tooltip(self.video_extensions_entry, "Comma-separated list of video extensions for directory scanning (e.g., .mp4,.avi,.mov).")

        self.recursive_scan_check = ttk.Checkbutton(tab, text="Recursive Directory Scan", variable=self.recursive_scan_var)
        self.recursive_scan_check.grid(row=3, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.recursive_scan_check, "If checked, scan directories recursively for videos.")

    def _populate_common_tab(self, tab):
        tab.columnconfigure(1, weight=1)
        lbl_pad = ttk.Label(tab, text="Padding (px):")
        lbl_pad.grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.padding_entry = ttk.Entry(tab, textvariable=self.padding_var, width=10)
        self.padding_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.padding_entry, "Padding around and between thumbnails.")

        lbl_bg = ttk.Label(tab, text="Background Color (hex):")
        lbl_bg.grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.bg_color_entry = ttk.Entry(tab, textvariable=self.background_color_var, width=10)
        self.bg_color_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.bg_color_entry, "Hex color for the MoviePrint background (e.g., #FFFFFF or white).")
        
        lbl_frame_fmt = ttk.Label(tab, text="Frame Format (temp):")
        lbl_frame_fmt.grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.frame_format_combo = ttk.Combobox(tab, textvariable=self.frame_format_var, values=["jpg", "png"], state="readonly", width=8)
        self.frame_format_combo.grid(row=2, column=1, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.frame_format_combo, "Format for temporary extracted frame images (jpg or png).")

        lbl_rotate = ttk.Label(tab, text="Rotate Thumbnails:")
        lbl_rotate.grid(row=3, column=0, sticky=tk.W, padx=5, pady=5)
        self.rotate_combo = ttk.Combobox(tab, textvariable=self.rotate_thumbnails_var, values=[0, 90, 180, 270], state="readonly", width=8)
        self.rotate_combo.grid(row=3, column=1, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.rotate_combo, "Rotate all thumbnails clockwise by the selected degrees (0, 90, 180, 270).")

        lbl_temp_dir = ttk.Label(tab, text="Custom Temp Directory:")
        lbl_temp_dir.grid(row=4, column=0, sticky=tk.W, padx=5, pady=5)
        self.temp_dir_entry = ttk.Entry(tab, textvariable=self.temp_dir_var, width=40)
        self.temp_dir_entry.grid(row=4, column=1, sticky=tk.EW, padx=5, pady=5)
        btn_browse_temp = ttk.Button(tab, text="Browse...", command=lambda: self.browse_specific_dir(self.temp_dir_var, "Select Custom Temporary Directory"))
        btn_browse_temp.grid(row=4, column=2, padx=5, pady=5)
        Tooltip(self.temp_dir_entry, "Optional. If set, temporary frames will be stored here and NOT auto-cleaned.")
        Tooltip(btn_browse_temp, "Browse for a custom temporary directory.")


        lbl_haar = ttk.Label(tab, text="Haar Cascade XML:")
        lbl_haar.grid(row=5, column=0, sticky=tk.W, padx=5, pady=5)
        self.haar_cascade_entry = ttk.Entry(tab, textvariable=self.haar_cascade_xml_var, width=40)
        self.haar_cascade_entry.grid(row=5, column=1, sticky=tk.EW, padx=5, pady=5)
        btn_browse_haar = ttk.Button(tab, text="Browse...", command=lambda: self.browse_specific_file(self.haar_cascade_xml_var, "Select Haar Cascade XML", (("XML files", "*.xml"),("All files", "*.*"))))
        btn_browse_haar.grid(row=5, column=2, padx=5, pady=5)
        Tooltip(self.haar_cascade_entry, "Optional. Path to Haar Cascade XML for face detection.\nUses OpenCV default if empty and face detection is enabled.")
        Tooltip(btn_browse_haar, "Browse for a Haar Cascade XML file.")

        self.save_metadata_check = ttk.Checkbutton(tab, text="Save Metadata JSON", variable=self.save_metadata_json_var)
        self.save_metadata_check.grid(row=6, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.save_metadata_check, "Save a JSON file with detailed metadata alongside the MoviePrint.")
        
        self.detect_faces_check = ttk.Checkbutton(tab, text="Detect Faces (slow)", variable=self.detect_faces_var)
        self.detect_faces_check.grid(row=7, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
        Tooltip(self.detect_faces_check, "Enable face detection on thumbnails. This can be performance intensive.")

    def _create_action_log_section(self, parent_frame):
        action_section = ttk.Frame(parent_frame, padding="10")
        action_section.pack(fill=tk.X, padx=5, pady=5)
        self.generate_button = ttk.Button(action_section, text="Generate MoviePrint", command=self.generate_movieprint_action)
        self.generate_button.pack(pady=5)
        Tooltip(self.generate_button, "Start generating the MoviePrint with current settings.")
        
        self.progress_bar = ttk.Progressbar(action_section, orient="horizontal", mode="determinate", length=300)
        self.progress_bar.pack(fill=tk.X, padx=5, pady=2)

        log_section = ttk.LabelFrame(parent_frame, text="Log", padding="10")
        log_section.pack(expand=True, fill=tk.BOTH, padx=5, pady=5)
        self.log_text = scrolledtext.ScrolledText(log_section, wrap=tk.WORD, state="disabled", height=10)
        self.log_text.pack(expand=True, fill=tk.BOTH)

    def browse_input_paths(self):
        filepaths = filedialog.askopenfilenames(
            title="Select Video File(s) (or cancel and select a directory next)",
            filetypes=(("Video files", "*.mp4 *.avi *.mov *.mkv *.flv *.wmv"), ("All files", "*.*"))
        )
        if filepaths:
            self._internal_input_paths = list(filepaths) 
            self.input_paths_var.set("; ".join(filepaths)) 
        else: 
            dir_path = filedialog.askdirectory(title="Select Directory of Videos")
            if dir_path:
                self._internal_input_paths = [dir_path]
                self.input_paths_var.set(dir_path)

    def browse_output_dir(self):
        dir_path = filedialog.askdirectory(title="Select Output Directory")
        if dir_path: self.output_dir_var.set(dir_path)

    def browse_specific_dir(self, tk_var, title_text):
        dir_path = filedialog.askdirectory(title=title_text)
        if dir_path: tk_var.set(dir_path)

    def browse_specific_file(self, tk_var, title_text, file_types):
        filepath = filedialog.askopenfilename(title=title_text, filetypes=file_types)
        if filepath: tk_var.set(filepath)
    
    def log_message_from_thread(self, message): 
        self.log_text.config(state="normal")
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state="disabled")

    def update_progress_from_thread(self, current, total, filename): 
        if total > 0:
            percentage = (current / total) * 100
            self.progress_bar["value"] = percentage
            if current < total and current != 0 : # Avoid double logging on first item
                self.log_message_from_thread(f"Processing {os.path.basename(filename)} ({current}/{total})...")
            elif current == total : # Batch finished
                self.log_message_from_thread(f"Batch processing finished. Processed {total} items.")
                # self.progress_bar["value"] = 0 # Resetting here might be too soon if other final logs come
        else: self.progress_bar["value"] = 0

    def check_queue(self): 
        try:
            while True:
                message_type, data = self.queue.get_nowait()
                if message_type == "log": self.log_message_from_thread(data)
                elif message_type == "progress":
                    current, total, filename = data
                    self.update_progress_from_thread(current, total, filename)
                elif message_type == "state":
                    if data == "enable_button": self.generate_button.config(state="normal")
                    elif data == "disable_button": self.generate_button.config(state="disabled")
                self.root.update_idletasks() 
        except queue.Empty: pass
        self.root.after(100, self.check_queue)

    def _gui_log_callback(self, message): self.queue.put(("log", message))
    def _gui_progress_callback(self, current, total, filename): self.queue.put(("progress", (current, total, filename)))

    def _parse_int_list_from_string(self, s, context_msg=""):
        if not s: return None
        try:
            return [int(item.strip()) for item in s.split(',') if item.strip()]
        except ValueError:
            messagebox.showerror("Input Error", f"Invalid format for {context_msg}. Expecting comma-separated numbers (e.g., 1,2,3).")
            return "ERROR" 

    def generate_movieprint_action(self):
        input_paths_str = self.input_paths_var.get()
        output_dir = self.output_dir_var.get()

        if not hasattr(self, '_internal_input_paths') or not self._internal_input_paths:
            if input_paths_str: self._internal_input_paths = [p.strip() for p in input_paths_str.split(';') if p.strip()]
            else: messagebox.showerror("Input Error", "Please select video file(s) or a directory."); return
        if not output_dir: messagebox.showerror("Input Error", "Please select an output directory."); return

        settings = argparse.Namespace()
        settings.input_paths = self._internal_input_paths
        settings.output_dir = output_dir
        
        settings.extraction_mode = self.extraction_mode_var.get()
        settings.layout_mode = self.layout_mode_var.get()

        try:
            settings.interval_seconds = float(self.interval_seconds_var.get()) if self.interval_seconds_var.get() else None
            settings.interval_frames = int(self.interval_frames_var.get()) if self.interval_frames_var.get() else None
            settings.shot_threshold = float(self.shot_threshold_var.get()) if self.shot_threshold_var.get() else 27.0
            
            settings.columns = int(self.num_columns_var.get()) if self.num_columns_var.get() else 5
            settings.target_row_height = int(self.target_row_height_var.get()) if self.target_row_height_var.get() else 150
            settings.output_image_width = int(self.output_image_width_var.get()) if self.output_image_width_var.get() else 1920
            settings.padding = int(self.padding_var.get()) if self.padding_var.get() else 5
        except ValueError as e: messagebox.showerror("Input Error", f"Invalid numeric value in settings: {e}"); return

        settings.background_color = self.background_color_var.get()
        settings.frame_format = self.frame_format_var.get()
        settings.save_metadata_json = self.save_metadata_json_var.get()
        settings.detect_faces = self.detect_faces_var.get()
        settings.rotate_thumbnails = self.rotate_thumbnails_var.get()

        settings.start_time = self.start_time_var.get() if self.start_time_var.get() else None
        settings.end_time = self.end_time_var.get() if self.end_time_var.get() else None
        
        settings.exclude_frames = self._parse_int_list_from_string(self.exclude_frames_var.get(), "Exclude Frames")
        if settings.exclude_frames == "ERROR": return 
        settings.exclude_shots = self._parse_int_list_from_string(self.exclude_shots_var.get(), "Exclude Shots")
        if settings.exclude_shots == "ERROR": return

        settings.output_filename_suffix = self.output_filename_suffix_var.get()
        settings.output_filename = self.output_filename_var.get() if self.output_filename_var.get() else None
        
        raw_video_extensions = self.video_extensions_var.get()
        settings.video_extensions = ",".join([ext.strip() for ext in raw_video_extensions.split(',') if ext.strip() and ext.startswith('.')]) \
                                   if raw_video_extensions else ".mp4,.avi,.mov,.mkv,.flv,.wmv"
        if not settings.video_extensions: # Ensure there's a default if user clears it and provides empty string
            messagebox.showwarning("Input Warning", "Video extensions field was empty or invalid; using default extensions.")
            settings.video_extensions = ".mp4,.avi,.mov,.mkv,.flv,.wmv"


        settings.recursive_scan = self.recursive_scan_var.get()
        settings.temp_dir = self.temp_dir_var.get() if self.temp_dir_var.get() else None
        settings.haar_cascade_xml = self.haar_cascade_xml_var.get() if self.haar_cascade_xml_var.get() else None

        self.log_text.config(state="normal"); self.log_text.delete(1.0, tk.END); self.log_text.config(state="disabled")
        self.queue.put(("state", "disable_button"))
        self.progress_bar["value"] = 0
        self._gui_log_callback("Starting generation...") # Initial log

        thread = threading.Thread(target=self.run_generation_in_thread, args=(settings, self._gui_log_callback, self._gui_progress_callback))
        thread.daemon = True
        thread.start()

    def run_generation_in_thread(self, settings, log_cb, progress_cb): 
        try:
            successful_ops, failed_ops = execute_movieprint_generation(settings, log_cb, progress_cb)
        except Exception as e:
            log_cb(f"An unexpected error occurred in the generation thread: {e}")
            import traceback
            log_cb(traceback.format_exc()) 
        finally:
            self.queue.put(("state", "enable_button"))
            # The summary is now printed by execute_movieprint_generation via log_cb
            # So, just a final marker here.
            self.queue.put(("log", "--- Processing Session Finished ---"))
            self.queue.put(("progress", (self.progress_bar['maximum'], self.progress_bar['maximum'], "Done"))) # Ensure progress bar hits 100% and resets

    def update_options_visibility(self, event=None):
        extraction_mode = self.extraction_mode_var.get()
        layout_mode = self.layout_mode_var.get()

        # Extraction Tab related
        if hasattr(self, 'interval_options_frame'): 
            is_interval_mode = extraction_mode == "interval"
            self.interval_options_frame.grid_remove() if not is_interval_mode else self.interval_options_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=(0,2))
            self.interval_frames_entry.config(state="normal" if is_interval_mode else "disabled")
            self.exclude_frames_entry.config(state="normal" if is_interval_mode else "disabled")

        if hasattr(self, 'shot_options_frame'):
            is_shot_mode = extraction_mode == "shot"
            self.shot_options_frame.grid_remove() if not is_shot_mode else self.shot_options_frame.grid(row=2, column=0, columnspan=2, sticky=tk.EW, pady=(0,2))
            self.exclude_shots_entry.config(state="normal" if is_shot_mode else "disabled")
        
        # Layout Tab related
        if hasattr(self, 'grid_options_frame'):
            self.grid_options_frame.grid_remove()
            if layout_mode == "grid":
                self.grid_options_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=3)

        if hasattr(self, 'timeline_options_frame'):
            self.timeline_options_frame.grid_remove()
            # Timeline layout is only truly valid if extraction mode is 'shot'.
            if layout_mode == "timeline":
                if extraction_mode != "shot":
                    self.layout_mode_var.set("grid") # Auto-switch to grid
                    if hasattr(self, 'grid_options_frame'): # Ensure grid options are visible
                         self.grid_options_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=3)
                    messagebox.showwarning("Layout Change", "Timeline layout requires 'Shot' extraction mode. Switched to 'Grid' layout.")
                else: # Valid combination
                    self.timeline_options_frame.grid(row=2, column=0, columnspan=2, sticky=tk.EW, pady=3)


if __name__ == "__main__":
    app = MoviePrintApp()
    app.root.mainloop()
```
