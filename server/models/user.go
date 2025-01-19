package models

var (
	UserList map[string]*User
)

type User struct {
	ID          string          `json:"id"`
	Username    string          `json:"username"`
	Type        string          `json:"type"`
	Token       string          `json:"token"`
	IsActive    bool            `json:"isActive"`
	IsLocked    bool            `json:"isLocked"`
	LastSeen    int             `json:"lastSeen"`
	CreatedAt   int             `json:"createdAt"`
	Permissions UserPermissions `json:"permissions"`
}

type UserPermissions struct {
	Download              bool `json:"download"`
	Update                bool `json:"update"`
	Delete                bool `json:"delete"`
	Upload                bool `json:"upload"`
	AccessAllLibraries    bool `json:"accessAllLibraries"`
	AccessAllTags         bool `json:"accessAllTags"`
	AccessExplicitContent bool `json:"accessExplicitContent"`
}
