from PIL import Image, ImageDraw, ImageColor
import os
import math

def _create_fixed_column_grid(image_objects_with_paths, output_path, columns, padding, background_color_rgb, **kwargs):
    """
    Arranges images into a grid with a fixed number of columns.
    Returns layout data for each thumbnail.

    Args:
        image_objects_with_paths (list): List of tuples (PIL.Image, str_image_path).
        ... (other args same)

    Returns:
        tuple: (bool_success, list_thumbnail_layout_data)
               Layout data is a list of dicts: {'image_path': str, 'x': int, 'y': int, 'width': int, 'height': int}
    """
    thumbnail_layout_data = []
    if not image_objects_with_paths:
        print("Error (_create_fixed_column_grid): No image objects provided.")
        return False, thumbnail_layout_data

    # Unzip image objects and their original paths
    image_objects = [item[0] for item in image_objects_with_paths]
    original_paths = [item[1] for item in image_objects_with_paths]

    max_thumb_width = 0
    max_thumb_height = 0
    for img in image_objects:
        if img.width > max_thumb_width: max_thumb_width = img.width
        if img.height > max_thumb_height: max_thumb_height = img.height

    if max_thumb_width == 0 or max_thumb_height == 0:
        print("Error (_create_fixed_column_grid): Could not determine valid dimensions.")
        return False, thumbnail_layout_data

    num_images = len(image_objects)
    rows = math.ceil(num_images / columns)
    grid_width = (columns * max_thumb_width) + ((columns + 1) * padding)
    grid_height = (rows * max_thumb_height) + ((rows + 1) * padding)

    grid_image = Image.new("RGB", (grid_width, grid_height), background_color_rgb)
    print(f"Creating fixed-column grid: {columns}c, {rows}r. Cell: {max_thumb_width}x{max_thumb_height}. Output: {grid_width}x{grid_height}px.")

    current_x = padding
    current_y = padding
    for i, img_obj in enumerate(image_objects):
        img_copy = img_obj.copy()
        img_copy.thumbnail((max_thumb_width, max_thumb_height), Image.Resampling.LANCZOS)
        
        final_w, final_h = img_copy.width, img_copy.height
        x_offset = (max_thumb_width - final_w) // 2
        y_offset = (max_thumb_height - final_h) // 2
        
        paste_x = current_x + x_offset
        paste_y = current_y + y_offset
        grid_image.paste(img_copy, (paste_x, paste_y))
        
        thumbnail_layout_data.append({
            'image_path': original_paths[i], # Store original path for mapping
            'x': paste_x,
            'y': paste_y,
            'width': final_w,
            'height': final_h
        })
        img_copy.close()

        if (i + 1) % columns == 0:
            current_x = padding
            current_y += max_thumb_height + padding
        else:
            current_x += max_thumb_width + padding
            
    try:
        grid_image.save(output_path)
        print(f"Fixed-column grid saved to {output_path}")
        return True, thumbnail_layout_data
    except Exception as e:
        print(f"Error saving fixed-column grid: {e}")
        return False, thumbnail_layout_data
    finally:
        grid_image.close()


def _create_timeline_view_grid(image_objects_with_paths_ratios, output_path,
                               max_grid_width, target_row_height, padding, background_color_rgb, **kwargs):
    """
    Arranges images into rows, width proportional to ratio. Returns layout data.

    Args:
        image_objects_with_paths_ratios (list): List of tuples (PIL.Image, str_image_path, float_ratio).
        ... (other args same)

    Returns:
        tuple: (bool_success, list_thumbnail_layout_data)
    """
    thumbnail_layout_data = []
    if not image_objects_with_paths_ratios:
        print("Error (_create_timeline_view_grid): Invalid inputs.")
        return False, thumbnail_layout_data
    
    # Unzip
    pil_images = [item[0] for item in image_objects_with_paths_ratios]
    original_paths = [item[1] for item in image_objects_with_paths_ratios]
    width_ratios = [item[2] for item in image_objects_with_paths_ratios]

    if target_row_height <= 0 or max_grid_width <= 0:
        print("Error (_create_timeline_view_grid): target_row_height and max_grid_width must be positive.")
        return False, thumbnail_layout_data

    print(f"Creating timeline view: MaxW={max_grid_width}, RowH={target_row_height}, Pad={padding}")

    scaled_images_info = [] # Store {'image': PIL.Image, 'original_path': str, 'original_width_at_row_h': int, 'ratio': float}
    for i, img_obj in enumerate(pil_images):
        aspect_ratio = img_obj.width / img_obj.height
        new_height = target_row_height
        new_width = int(new_height * aspect_ratio)
        try:
            scaled_img = img_obj.resize((new_width, new_height), Image.Resampling.LANCZOS)
            scaled_images_info.append({
                'image': scaled_img,
                'original_path': original_paths[i],
                'original_width_at_row_h': new_width,
                'ratio': width_ratios[i]
            })
        except Exception as e:
            print(f"Warning: Could not resize image {original_paths[i]}: {e}. Skipping.")
            continue

    if not scaled_images_info:
        print("Error: No images could be scaled for timeline view.")
        return False, thumbnail_layout_data

    final_rows_layout_details = [] # Stores list of rows; each row = list of item details for that row
    current_y = padding
    
    # Row packing logic
    row_buffer = []
    current_row_sum_original_widths_at_row_h = 0
    current_row_sum_ratios = 0.0

    for i, item_info in enumerate(scaled_images_info):
        # Check if adding this item would overflow the row (using original aspect ratio widths as heuristic)
        potential_sum_widths = current_row_sum_original_widths_at_row_h + item_info['original_width_at_row_h']
        potential_paddings = (len(row_buffer) + 1 + 1) * padding # Items + outer paddings for row

        if row_buffer and (potential_sum_widths + potential_paddings > max_grid_width) :
            if row_buffer: # Finalize current row
                final_rows_layout_details.append({
                    'items_info': list(row_buffer), 
                    'sum_ratios_in_row': current_row_sum_ratios, 
                    'y_pos': current_y
                })
                current_y += target_row_height + padding
                row_buffer = []
                current_row_sum_original_widths_at_row_h = 0
                current_row_sum_ratios = 0.0
        
        row_buffer.append(item_info)
        current_row_sum_original_widths_at_row_h += item_info['original_width_at_row_h']
        current_row_sum_ratios += item_info['ratio']

    if row_buffer: # Add the last row
        final_rows_layout_details.append({
            'items_info': list(row_buffer), 
            'sum_ratios_in_row': current_row_sum_ratios, 
            'y_pos': current_y
        })
        current_y += target_row_height + padding # This sets up for next row, so total height is this value

    total_grid_height = current_y if final_rows_layout_details else padding
    if total_grid_height <= padding and scaled_images_info : # If any images but no rows fit
         total_grid_height = padding + target_row_height + padding # Minimum for one row

    if not final_rows_layout_details:
        print("Error: No images could be laid out in timeline view (possibly max_grid_width too small).")
        # Close images that were scaled but not used
        for item in scaled_images_info: item['image'].close()
        return False, thumbnail_layout_data
    
    grid_image = Image.new("RGB", (max_grid_width, total_grid_height), background_color_rgb)
    
    for row_detail in final_rows_layout_details:
        current_x = padding
        y_pos = row_detail['y_pos']
        num_images_in_row = len(row_detail['items_info'])
        available_width_for_images = max_grid_width - (num_images_in_row + 1) * padding

        if available_width_for_images <= 0 or row_detail['sum_ratios_in_row'] == 0:
            print(f"Warning: Row at y={y_pos} has no space or zero sum_ratios. Skipping paste.")
            continue

        for item_info in row_detail['items_info']:
            img_scaled_to_row_h = item_info['image'] # Already at target_row_height
            
            final_thumb_width = int((item_info['ratio'] / row_detail['sum_ratios_in_row']) * available_width_for_images)
            final_thumb_height = target_row_height # Height is fixed for the row

            if final_thumb_width <= 0:
                print(f"Warning: Calculated width for image {item_info['original_path']} is <=0. Skipping.")
                continue
            
            # Resize to final calculated proportional width, maintaining target_row_height
            # This step effectively applies the timeline bar-like scaling
            final_img_for_cell = img_scaled_to_row_h.resize((final_thumb_width, final_thumb_height), Image.Resampling.LANCZOS)
            
            grid_image.paste(final_img_for_cell, (current_x, y_pos))
            thumbnail_layout_data.append({
                'image_path': item_info['original_path'],
                'x': current_x, 'y': y_pos,
                'width': final_thumb_width, 'height': final_thumb_height
            })
            # final_img_for_cell.close() # This is a new object from resize, close it
            # No, img_scaled_to_row_h is the one to close eventually. final_img_for_cell is temporary for paste.
            # The scaled_images_info[X]['image'] are closed at the end of parent function.
            
            current_x += final_thumb_width + padding
            
    try:
        grid_image.save(output_path)
        print(f"Timeline view grid saved to {output_path}")
        # Close the intermediate scaled images
        for item in scaled_images_info: item['image'].close()
        return True, thumbnail_layout_data
    except Exception as e:
        print(f"Error saving timeline view grid: {e}")
        for item in scaled_images_info: item['image'].close()
        return False, thumbnail_layout_data
    finally:
        grid_image.close()


def create_image_grid(
    image_source_data, # List of paths (grid) or list of {'image_path': str, 'width_ratio': float} (timeline)
    output_path,
    padding,
    background_color_hex="#FFFFFF",
    layout_mode="grid",
    columns=None, # For 'grid' mode
    target_row_height=None, # For 'timeline' mode
    max_grid_width=None # For 'timeline' mode
):
    """
    Arranges images into a grid. Returns success status and layout data.

    Args:
        image_source_data: Data for images. Format depends on layout_mode.
        ... (other args same as before)

    Returns:
        tuple: (bool_success, list_thumbnail_layout_data)
               Layout data is a list of dicts: 
               {'image_path': str, 'x': int, 'y': int, 'width': int, 'height': int}
               or an empty list on failure.
    """
    thumbnail_layout_data = [] # Initialize to ensure it's always returned
    if not image_source_data:
        print("Error: No image source data provided."); return False, thumbnail_layout_data
    if padding < 0:
        print("Error: Padding cannot be negative."); return False, thumbnail_layout_data

    try: background_color_rgb = ImageColor.getrgb(background_color_hex)
    except ValueError: print(f"Warning: Invalid hex '{background_color_hex}'. Using white."); background_color_rgb = (255,255,255)

    # Load images and prepare input for helper functions
    # Helper functions now expect list of (PIL.Image, original_path_str) or (PIL.Image, original_path_str, ratio_float)
    
    processed_image_input = [] # This will be passed to the layout functions

    if layout_mode == "timeline":
        if not all(isinstance(item, dict) and 'image_path' in item and 'width_ratio' in item for item in image_source_data):
            print("Error: For timeline mode, image_source_data requires dicts with 'image_path' and 'width_ratio'.")
            return False, thumbnail_layout_data
        if target_row_height is None or max_grid_width is None or target_row_height <= 0 or max_grid_width <= 0:
            print("Error: For timeline mode, target_row_height and max_grid_width must be positive.")
            return False, thumbnail_layout_data

        for item in image_source_data:
            img_path = item['image_path']
            ratio = item['width_ratio']
            if not os.path.exists(img_path): print(f"Warning: Image not found: {img_path}. Skipping."); continue
            try:
                img = Image.open(img_path); img.load()
                processed_image_input.append((img, img_path, float(ratio))) # (PIL.Image, path, ratio)
            except Exception as e: print(f"Warning: Could not load image {img_path}: {e}. Skipping."); continue
            
    elif layout_mode == "grid":
        if columns is None or columns <= 0:
            print("Error: For grid mode, 'columns' must be a positive integer."); return False, thumbnail_layout_data
        if not all(isinstance(p, str) for p in image_source_data): # Expecting list of paths
             print("Error: For grid mode, image_source_data must be a list of image file paths."); return False, thumbnail_layout_data
        
        for img_path in image_source_data:
            if not os.path.exists(img_path): print(f"Warning: Image not found: {img_path}. Skipping."); continue
            try:
                img = Image.open(img_path); img.load()
                processed_image_input.append((img, img_path)) # (PIL.Image, path)
            except Exception as e: print(f"Warning: Could not load image {img_path}: {e}. Skipping."); continue
    else:
        print(f"Error: Unknown layout_mode '{layout_mode}'."); return False, thumbnail_layout_data

    if not processed_image_input:
        print("Error: No valid images could be loaded or processed."); return False, thumbnail_layout_data

    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        try: os.makedirs(output_dir); print(f"Created output directory: {output_dir}")
        except OSError as e: print(f"Error creating output dir {output_dir}: {e}"); return False, thumbnail_layout_data
            
    success = False
    if layout_mode == "grid":
        success, thumbnail_layout_data = _create_fixed_column_grid(
            processed_image_input, output_path, columns, padding, background_color_rgb
        )
    elif layout_mode == "timeline":
        success, thumbnail_layout_data = _create_timeline_view_grid(
            processed_image_input, output_path, max_grid_width, target_row_height, padding, background_color_rgb
        )
    
    # Close all PIL.Image objects that were opened and stored in processed_image_input
    for item_tuple in processed_image_input:
        try: item_tuple[0].close() # The PIL.Image object is the first element
        except Exception: pass

    return success, thumbnail_layout_data


if __name__ == "__main__":
    print("Starting image grid creation process demonstrations...")
    dummy_image_folder = "dummy_thumbnails_grid_metadata"
    if os.path.exists(dummy_image_folder): shutil.rmtree(dummy_image_folder) # Clean start
    os.makedirs(dummy_image_folder)
    
    num_dummy_images = 12
    dummy_paths_for_grid = []
    dummy_data_for_timeline = []

    for i in range(num_dummy_images):
        path = os.path.join(dummy_image_folder, f"dummy_thumb_{i+1:02d}.png")
        try:
            img = Image.new("RGB", (120 + (i%3*20), 90 + (i%2*15)), ((i*20)%255, (i*10)%255, (i*5)%255))
            ImageDraw.Draw(img).text((10,10), f"T{i+1}", fill=(255,255,255))
            img.save(path); img.close()
            dummy_paths_for_grid.append(path)
            dummy_data_for_timeline.append({'image_path': path, 'width_ratio': 1.0 + (i % 4)})
        except Exception as e: print(f"Error creating dummy img {path}: {e}")

    output_grids_folder = "output_grids_metadata"
    if os.path.exists(output_grids_folder): shutil.rmtree(output_grids_folder) # Clean start
    os.makedirs(output_grids_folder)

    if not dummy_paths_for_grid:
        print("No dummy images created. Aborting examples.")
    else:
        print(f"\n--- Example 1: Fixed Column Grid (returning layout) ---")
        grid_ok, grid_layout = create_image_grid(
            image_source_data=dummy_paths_for_grid,
            output_path=os.path.join(output_grids_folder, "grid_fixed_metadata.png"),
            padding=5, layout_mode="grid", columns=4
        )
        if grid_ok: print(f"  Grid layout items: {len(grid_layout)}. First item: {grid_layout[0] if grid_layout else 'N/A'}")

        print(f"\n--- Example 2: Timeline View Grid (returning layout) ---")
        timeline_ok, timeline_layout = create_image_grid(
            image_source_data=dummy_data_for_timeline,
            output_path=os.path.join(output_grids_folder, "grid_timeline_metadata.png"),
            padding=8, layout_mode="timeline", target_row_height=90, max_grid_width=700
        )
        if timeline_ok: print(f"  Timeline layout items: {len(timeline_layout)}. First item: {timeline_layout[0] if timeline_layout else 'N/A'}")

    print("\nImage grid script demonstrations finished.")
```
