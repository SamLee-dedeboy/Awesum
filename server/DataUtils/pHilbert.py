from .gilbert2d import gilbert2d

def peripheral_hilbert(width, s_height):
    l_height = width + 2*s_height
    m_height = width + s_height
    points = []
    # generate four gilbert curves
    # 1. top
    top_points = translate(gilbert2d(width, s_height), s_height, 0)
    # flip the y axis
    points += top_points

    # 2. right
    right_points = translate(gilbert2d(s_height, l_height), m_height, 0)
    points += right_points

    # 3. bottom
    bottom_points = translate(flip_xy(gilbert2d(width, s_height), width, s_height), s_height, m_height)
    points += bottom_points

    # 4. left
    left_points = flip_xy(gilbert2d(s_height, l_height), s_height, l_height)
    points += left_points

    return points

def flip_y(points, height):
    return [(x, height-1-y) for (x, y) in points]
def flip_x(points, width):
    return [(width-1-x, y) for (x, y) in points]
def flip_xy(points, width, height):
    return [(width-1-x, height-1-y) for (x, y) in points]

def translate(points, dx, dy):
    return [(x+dx, y+dy) for (x, y) in points]

    
