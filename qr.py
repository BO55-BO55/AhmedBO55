import qrcode
from PIL import Image, ImageDraw, ImageFont
import io
import base64

class RoboticsClubQRGenerator:
    def __init__(self):
        self.club_name = "🤖 Robotics Club"
        
    def generate_qr_code(self, email, password, child_name="", parent_name="", save_path=None):
        """
        Generate a QR code for the robotics club login system
        
        Args:
            email (str): User's email address
            password (str): User's password
            child_name (str): Child's name (optional, for display)
            parent_name (str): Parent's name (optional, for display)
            save_path (str): Path to save the QR code image (optional)
        
        Returns:
            PIL.Image: QR code image
        """
        
        # Create the data to encode (you can modify this format based on your needs)
        # For your current system, you might want to encode just the user ID or a token
        # But since this is standalone, I'll create a simple format
        qr_data = f"{email}:{password}"
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,  # Controls the size of the QR code
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Add data to QR code
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Create a badge with QR code
        badge = self.create_badge(qr_img, email, child_name, parent_name)
        
        # Save if path provided
        if save_path:
            badge.save(save_path)
            print(f"QR code badge saved to: {save_path}")
        
        return badge
    
    def create_badge(self, qr_img, email, child_name="", parent_name=""):
        """
        Create a complete badge with QR code and user information
        
        Args:
            qr_img: QR code image
            email: User's email
            child_name: Child's name
            parent_name: Parent's name
            
        Returns:
            PIL.Image: Complete badge image
        """
        
        # Badge dimensions
        badge_width = 400
        badge_height = 600
        
        # Create new image for badge
        badge = Image.new('RGB', (badge_width, badge_height), 'white')
        draw = ImageDraw.Draw(badge)
        
        # Try to use a default font, fallback to default if not available
        try:
            title_font = ImageFont.truetype("arial.ttf", 24)
            info_font = ImageFont.truetype("arial.ttf", 16)
            small_font = ImageFont.truetype("arial.ttf", 12)
        except:
            # Fallback to default font if system fonts not available
            title_font = ImageFont.load_default()
            info_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Draw title
        title = self.club_name
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (badge_width - title_width) // 2
        draw.text((title_x, 20), title, fill='black', font=title_font)
        
        # Draw border
        draw.rectangle([10, 10, badge_width-10, badge_height-10], outline='black', width=2)
        
        # Position QR code
        qr_size = 200
        qr_img_resized = qr_img.resize((qr_size, qr_size))
        qr_x = (badge_width - qr_size) // 2
        qr_y = 80
        badge.paste(qr_img_resized, (qr_x, qr_y))
        
        # Add user information
        y_offset = qr_y + qr_size + 30
        
        if child_name:
            child_text = f"Child: {child_name}"
            child_bbox = draw.textbbox((0, 0), child_text, font=info_font)
            child_width = child_bbox[2] - child_bbox[0]
            child_x = (badge_width - child_width) // 2
            draw.text((child_x, y_offset), child_text, fill='black', font=info_font)
            y_offset += 30
        
        if parent_name:
            parent_text = f"Parent: {parent_name}"
            parent_bbox = draw.textbbox((0, 0), parent_text, font=info_font)
            parent_width = parent_bbox[2] - parent_bbox[0]
            parent_x = (badge_width - parent_width) // 2
            draw.text((parent_x, y_offset), parent_text, fill='black', font=info_font)
            y_offset += 30
        
        # Add email
        email_text = f"Email: {email}"
        email_bbox = draw.textbbox((0, 0), email_text, font=small_font)
        email_width = email_bbox[2] - email_bbox[0]
        email_x = (badge_width - email_width) // 2
        draw.text((email_x, y_offset), email_text, fill='black', font=small_font)
        
        # Add instruction
        instruction = "Scan this code to log in"
        instruction_bbox = draw.textbbox((0, 0), instruction, font=small_font)
        instruction_width = instruction_bbox[2] - instruction_bbox[0]
        instruction_x = (badge_width - instruction_width) // 2
        draw.text((instruction_x, badge_height - 40), instruction, fill='gray', font=small_font)
        
        return badge
    
    def generate_simple_qr(self, email, password, save_path=None):
        """
        Generate a simple QR code without badge formatting
        
        Args:
            email (str): User's email
            password (str): User's password
            save_path (str): Path to save the QR code
            
        Returns:
            PIL.Image: Simple QR code image
        """
        
        qr_data = f"{email}:{password}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        if save_path:
            qr_img.save(save_path)
            print(f"Simple QR code saved to: {save_path}")
        
        return qr_img

# Example usage
if __name__ == "__main__":
    # Create generator instance
    generator = RoboticsClubQRGenerator()
    
    # Example 1: Generate a complete badge
    print("=== Generating Complete Badge ===")
    email = "parent@example.com"
    password = "password123"
    child_name = "John Doe"
    parent_name = "Jane Doe"
    
    badge = generator.generate_qr_code(
        email=email,
        password=password,
        child_name=child_name,
        parent_name=parent_name,
        save_path="robotics_club_badge.png"
    )
    
    # Example 2: Generate simple QR code
    print("\n=== Generating Simple QR Code ===")
    simple_qr = generator.generate_simple_qr(
        email=email,
        password=password,
        save_path="simple_qr_code.png"
    )
    
    # Example 3: Interactive input
    print("\n=== Interactive QR Code Generation ===")
    print("Enter user details to generate QR code:")
    
    user_email = input("Email: ")
    user_password = input("Password: ")
    user_child_name = input("Child's Name (optional): ")
    user_parent_name = input("Parent's Name (optional): ")
    
    # Generate filename based on child name or email
    filename = f"qr_badge_{user_child_name.replace(' ', '_').lower() if user_child_name else user_email.split('@')[0]}.png"
    
    user_badge = generator.generate_qr_code(
        email=user_email,
        password=user_password,
        child_name=user_child_name,
        parent_name=user_parent_name,
        save_path=filename
    )
    
    print(f"\nQR code badge generated successfully!")
    print(f"The QR code contains: {user_email}:{user_password}")
    print(f"You can modify the scanning logic in your web app to parse this format.")